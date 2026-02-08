/*
  Safe incremental auth migration for existing SpaceBookingApp DBs.
  - Idempotent: checks object/column/index existence before creating/updating
  - Non-destructive: does not drop existing tables/columns
  - Backfills Username from FullName (slug-like) only when Username is null
*/

SET NOCOUNT ON;

BEGIN TRY
  BEGIN TRANSACTION;

  -- 1) Ensure Users table exists
  IF OBJECT_ID('dbo.Users', 'U') IS NULL
  BEGIN
    THROW 50001, 'Users table not found. Run base schema first.', 1;
  END

  -- 2) Add new auth columns to Users (if missing)
  IF COL_LENGTH('dbo.Users', 'Username') IS NULL
    ALTER TABLE dbo.Users ADD Username NVARCHAR(64) NULL;

  IF COL_LENGTH('dbo.Users', 'PasswordHash') IS NULL
    ALTER TABLE dbo.Users ADD PasswordHash NVARCHAR(500) NULL;

  IF COL_LENGTH('dbo.Users', 'PhoneVerifiedAt') IS NULL
    ALTER TABLE dbo.Users ADD PhoneVerifiedAt DATETIME2 NULL;

  IF COL_LENGTH('dbo.Users', 'MustChangePassword') IS NULL
  BEGIN
    ALTER TABLE dbo.Users ADD MustChangePassword BIT NOT NULL CONSTRAINT DF_Users_MustChangePassword DEFAULT(0);
  END

  -- 3) Best-effort backfill PhoneVerifiedAt when Phone exists and PhoneVerifiedAt is null
  -- Use dynamic SQL to avoid compile-time binding errors on legacy schemas.
  IF COL_LENGTH('dbo.Users', 'Phone') IS NOT NULL
     AND COL_LENGTH('dbo.Users', 'PhoneVerifiedAt') IS NOT NULL
  BEGIN
    DECLARE @BackfillPhoneVerifiedSql NVARCHAR(MAX);

    IF COL_LENGTH('dbo.Users', 'CreatedAt') IS NOT NULL
      SET @BackfillPhoneVerifiedSql = N'
        UPDATE dbo.Users
        SET PhoneVerifiedAt = COALESCE(PhoneVerifiedAt, CreatedAt, SYSUTCDATETIME())
        WHERE Phone IS NOT NULL AND PhoneVerifiedAt IS NULL;';
    ELSE
      SET @BackfillPhoneVerifiedSql = N'
        UPDATE dbo.Users
        SET PhoneVerifiedAt = COALESCE(PhoneVerifiedAt, SYSUTCDATETIME())
        WHERE Phone IS NOT NULL AND PhoneVerifiedAt IS NULL;';

    EXEC sys.sp_executesql @BackfillPhoneVerifiedSql;
  END

  -- 4) Backfill Username from FullName when available and Username is null
  -- Dynamic SQL avoids invalid-column compile errors when FullName does not exist.
  IF COL_LENGTH('dbo.Users', 'FullName') IS NOT NULL
     AND COL_LENGTH('dbo.Users', 'Username') IS NOT NULL
  BEGIN
    DECLARE @BackfillUsernameSql NVARCHAR(MAX) = N'
      ;WITH base AS (
        SELECT
          UserId,
          LEFT(
            LOWER(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(LTRIM(RTRIM(FullName)), '' '', ''_''),
                  ''.'', ''''),
                '','', ''''),
              ''-'', ''_'')
            ),
            40
          ) AS BaseUsername
        FROM dbo.Users
        WHERE Username IS NULL
          AND FullName IS NOT NULL
          AND LTRIM(RTRIM(FullName)) <> ''''
      ), ranked AS (
        SELECT
          UserId,
          BaseUsername,
          ROW_NUMBER() OVER (PARTITION BY BaseUsername ORDER BY UserId) AS rn
        FROM base
        WHERE BaseUsername IS NOT NULL AND BaseUsername <> ''''
      )
      UPDATE u
      SET Username = LEFT(CASE WHEN r.rn = 1 THEN r.BaseUsername ELSE CONCAT(r.BaseUsername, ''_'', r.rn) END, 64)
      FROM dbo.Users u
      JOIN ranked r ON r.UserId = u.UserId
      WHERE u.Username IS NULL;';

    EXEC sys.sp_executesql @BackfillUsernameSql;
  END

  -- 5) Ensure AuthProviders exists (create if missing)
  IF OBJECT_ID('dbo.AuthProviders', 'U') IS NULL
  BEGIN
    CREATE TABLE dbo.AuthProviders (
      ProviderId INT IDENTITY(1,1) PRIMARY KEY,
      UserId INT NOT NULL,
      ProviderType NVARCHAR(20) NOT NULL,
      ProviderSubject NVARCHAR(200) NOT NULL,
      CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_AuthProviders_CreatedAt DEFAULT SYSUTCDATETIME(),
      CONSTRAINT FK_AuthProviders_UserId FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
    );
  END

  -- 6) Ensure AccountEvents exists
  IF OBJECT_ID('dbo.AccountEvents', 'U') IS NULL
  BEGIN
    CREATE TABLE dbo.AccountEvents (
      EventId INT IDENTITY(1,1) PRIMARY KEY,
      UserId INT NOT NULL,
      Type NVARCHAR(60) NOT NULL,
      MetadataJson NVARCHAR(MAX) NULL,
      CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_AccountEvents_CreatedAt DEFAULT SYSUTCDATETIME(),
      CONSTRAINT FK_AccountEvents_UserId FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
    );
  END

  -- 7) Convert legacy ProviderType='phone' to 'local' (safe update)
  IF OBJECT_ID('dbo.AuthProviders', 'U') IS NOT NULL
  BEGIN
    UPDATE dbo.AuthProviders
    SET ProviderType = 'local'
    WHERE ProviderType = 'phone';
  END

  -- 8) Ensure each user with Username has a local provider row
  -- Dynamic SQL avoids compile-time invalid-column errors when Username is absent in legacy schemas.
  IF OBJECT_ID('dbo.AuthProviders', 'U') IS NOT NULL
     AND COL_LENGTH('dbo.Users', 'Username') IS NOT NULL
  BEGIN
    DECLARE @InsertLocalProviderSql NVARCHAR(MAX) = N'
      INSERT INTO dbo.AuthProviders (UserId, ProviderType, ProviderSubject)
      SELECT u.UserId, ''local'', u.Username
      FROM dbo.Users u
      WHERE u.Username IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM dbo.AuthProviders ap
          WHERE ap.ProviderType = ''local''
            AND ap.ProviderSubject = u.Username
        );';

    EXEC sys.sp_executesql @InsertLocalProviderSql;
  END

  -- 9) Unique indexes (only create when no duplicates)
  IF COL_LENGTH('dbo.Users', 'Username') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Users_Username' AND object_id = OBJECT_ID('dbo.Users'))
  BEGIN
    DECLARE @HasDuplicateUsername INT = 0;
    DECLARE @CheckDuplicateUsernameSql NVARCHAR(MAX) = N'
      SELECT @HasDup = CASE WHEN EXISTS (
        SELECT Username
        FROM dbo.Users
        WHERE Username IS NOT NULL
        GROUP BY Username
        HAVING COUNT(*) > 1
      ) THEN 1 ELSE 0 END;';

    EXEC sys.sp_executesql
      @CheckDuplicateUsernameSql,
      N'@HasDup INT OUTPUT',
      @HasDup = @HasDuplicateUsername OUTPUT;

    IF @HasDuplicateUsername = 0
    BEGIN
      EXEC sys.sp_executesql N'CREATE UNIQUE INDEX UX_Users_Username ON dbo.Users(Username) WHERE Username IS NOT NULL;';
    END
    ELSE
    BEGIN
      PRINT 'WARNING: Duplicate Username values found. UX_Users_Username not created.';
    END
  END

  IF COL_LENGTH('dbo.Users', 'Phone') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Users_Phone' AND object_id = OBJECT_ID('dbo.Users'))
  BEGIN
    DECLARE @HasDuplicatePhone INT = 0;
    DECLARE @CheckDuplicatePhoneSql NVARCHAR(MAX) = N'
      SELECT @HasDup = CASE WHEN EXISTS (
        SELECT Phone
        FROM dbo.Users
        WHERE Phone IS NOT NULL
        GROUP BY Phone
        HAVING COUNT(*) > 1
      ) THEN 1 ELSE 0 END;';

    EXEC sys.sp_executesql
      @CheckDuplicatePhoneSql,
      N'@HasDup INT OUTPUT',
      @HasDup = @HasDuplicatePhone OUTPUT;

    IF @HasDuplicatePhone = 0
    BEGIN
      EXEC sys.sp_executesql N'CREATE UNIQUE INDEX UX_Users_Phone ON dbo.Users(Phone) WHERE Phone IS NOT NULL;';
    END
    ELSE
    BEGIN
      PRINT 'WARNING: Duplicate Phone values found (or Phone column missing). UX_Users_Phone not created.';
    END
  END

  IF OBJECT_ID('dbo.AuthProviders', 'U') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_AuthProviders_Provider' AND object_id = OBJECT_ID('dbo.AuthProviders'))
  BEGIN
    DECLARE @HasDuplicateProvider INT = 0;
    DECLARE @CheckDuplicateProviderSql NVARCHAR(MAX) = N'
      SELECT @HasDup = CASE WHEN EXISTS (
        SELECT ProviderType, ProviderSubject
        FROM dbo.AuthProviders
        GROUP BY ProviderType, ProviderSubject
        HAVING COUNT(*) > 1
      ) THEN 1 ELSE 0 END;';

    EXEC sys.sp_executesql
      @CheckDuplicateProviderSql,
      N'@HasDup INT OUTPUT',
      @HasDup = @HasDuplicateProvider OUTPUT;

    IF @HasDuplicateProvider = 0
    BEGIN
      EXEC sys.sp_executesql N'CREATE UNIQUE INDEX UX_AuthProviders_Provider ON dbo.AuthProviders(ProviderType, ProviderSubject);';
    END
    ELSE
    BEGIN
      PRINT 'WARNING: Duplicate provider mappings found. UX_AuthProviders_Provider not created.';
    END
  END

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;

  DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
  DECLARE @ErrNum INT = ERROR_NUMBER();
  DECLARE @ErrState INT = ERROR_STATE();
  THROW @ErrNum, @ErrMsg, @ErrState;
END CATCH;

-- Post-migration diagnostics (dynamic to support legacy schemas)
DECLARE @UserDiagSql NVARCHAR(MAX) = N'SELECT TOP 20 UserId';
IF COL_LENGTH('dbo.Users', 'Username') IS NOT NULL SET @UserDiagSql += N', Username';
IF COL_LENGTH('dbo.Users', 'Phone') IS NOT NULL SET @UserDiagSql += N', Phone';
IF COL_LENGTH('dbo.Users', 'PhoneVerifiedAt') IS NOT NULL SET @UserDiagSql += N', PhoneVerifiedAt';
IF COL_LENGTH('dbo.Users', 'Role') IS NOT NULL SET @UserDiagSql += N', Role';
IF COL_LENGTH('dbo.Users', 'MustChangePassword') IS NOT NULL SET @UserDiagSql += N', MustChangePassword';
SET @UserDiagSql += N' FROM dbo.Users ORDER BY UserId;';
EXEC sys.sp_executesql @UserDiagSql;

IF OBJECT_ID('dbo.AuthProviders', 'U') IS NOT NULL
BEGIN
  EXEC sys.sp_executesql N'
    SELECT TOP 20 ProviderId, UserId, ProviderType, ProviderSubject, CreatedAt
    FROM dbo.AuthProviders
    ORDER BY ProviderId;';
END
