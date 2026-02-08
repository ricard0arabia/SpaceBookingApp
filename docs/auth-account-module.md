# Authentication & Account Management Revamp

## Sequence Diagrams

### 1) Local signup (Firebase OTP -> backend account create)
```mermaid
sequenceDiagram
  participant U as User
  participant FE as Vue SPA
  participant FB as Firebase Phone Auth
  participant API as Express API
  participant DB as SQL Server
  U->>FE: Enter username, password, phone
  FE->>FB: signInWithPhoneNumber(phone, reCAPTCHA)
  FB-->>U: OTP challenge
  U->>FE: Enter OTP
  FE->>FB: confirm(otp)
  FB-->>FE: firebaseIdToken
  FE->>API: POST /auth/local/signup/complete
  API->>API: Verify App Check + Firebase ID token
  API->>DB: Insert Users + AuthProviders(local)
  API-->>FE: Session cookie + user
```

### 2) Local login
```mermaid
sequenceDiagram
  participant U as User
  participant FE as Vue SPA
  participant API as Express API
  participant DB as SQL Server
  U->>FE: Enter username + password
  FE->>API: POST /auth/local/login
  API->>DB: Find user by username
  API->>API: Verify Argon2id hash
  API-->>FE: Session cookie + user
  FE->>API: GET /api/me
```

### 3) Google OAuth login
```mermaid
sequenceDiagram
  participant U as User
  participant FE as Vue SPA
  participant API as Express API
  participant G as Google OAuth
  participant DB as SQL Server
  U->>FE: Click Continue with Google
  FE->>API: GET /auth/google
  API->>API: Generate + store OAuth state
  API->>G: Redirect with state
  G-->>API: Callback with code + state
  API->>API: Validate state
  API->>DB: Find/create user + AuthProviders(google)
  API-->>FE: Session cookie redirect
```

### 4) Forgot password (Firebase OTP -> forced reset)
```mermaid
sequenceDiagram
  participant U as User
  participant FE as Vue SPA
  participant FB as Firebase Phone Auth
  participant API as Express API
  participant DB as SQL Server
  U->>FE: Enter phone
  FE->>FB: signInWithPhoneNumber + reCAPTCHA
  U->>FE: Enter OTP
  FE->>FB: confirm(otp)
  FB-->>FE: firebaseIdToken
  FE->>API: POST /auth/local/recovery/start
  API->>API: Verify App Check + Firebase token + fresh auth_time
  API->>DB: Lookup user by verified phone
  API->>DB: Set MustChangePassword=1 + audit event
  API-->>FE: Generic success response
  FE->>API: POST /auth/local/recovery/complete
  API->>DB: Update password hash + clear MustChangePassword
```

### 5) Change phone (Firebase OTP)
```mermaid
sequenceDiagram
  participant U as User
  participant FE as Vue SPA
  participant FB as Firebase Phone Auth
  participant API as Express API
  participant DB as SQL Server
  U->>FE: Enter new phone + current password
  FE->>FB: signInWithPhoneNumber + reCAPTCHA
  U->>FE: Enter OTP
  FE->>FB: confirm(otp)
  FB-->>FE: firebaseIdToken
  FE->>API: POST /api/settings/phone/change
  API->>API: Verify session + App Check + Firebase token freshness
  API->>DB: Verify current password + unique phone
  API->>DB: Update phone + PhoneVerifiedAt + audit event
  API-->>FE: Updated user
```

## Backend MVC Layout (Auth module)
- `backend/src/controllers/authController.ts`
- `backend/src/services/authService.ts`
- `backend/src/repositories/userRepository.ts`
- `backend/src/routes/authRoutes.ts`
- `backend/src/middleware/appCheck.ts`
- `backend/src/middleware/csrf.ts`
- `backend/src/middleware/rateLimiters.ts`
- `backend/src/config/session.ts`
- `backend/src/config/passport.ts`
- `backend/src/config/firebaseAdmin.ts`

## Frontend Module Surface
- Routes: `/login`, `/signup`, `/forgot-password`, `/force-password-reset`, `/portal/settings`
- Views:
  - `frontend/src/views/LoginPage.vue`
  - `frontend/src/views/SignupPage.vue`
  - `frontend/src/views/ForgotPasswordPage.vue`
  - `frontend/src/views/ForcePasswordResetPage.vue`
  - `frontend/src/views/PortalSettings.vue`
- Store: `frontend/src/stores/useAuthStore.ts`
- Repository: `frontend/src/repositories/AuthRepository.ts`
- Firebase helpers:
  - `frontend/src/config/firebase.ts`
  - `frontend/src/config/appCheck.ts`
  - `frontend/src/services/firebasePhoneAuth.ts`

## SQL Artifacts
- `sql/schema.sql`
- `sql/migrations/001_indexes.sql`

## Security Wiring
- Session cookies + redis-backed sessions in `backend/src/config/session.ts`.
- CSRF enforcement for state-changing endpoints in `backend/src/middleware/csrf.ts`.
- Endpoint-specific rate limits in `backend/src/middleware/rateLimiters.ts`.
- App Check verification middleware in `backend/src/middleware/appCheck.ts`.
- Firebase ID token verification + freshness checks in `backend/src/services/authService.ts`.
