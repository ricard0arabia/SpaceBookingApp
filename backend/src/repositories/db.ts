import { Connection, Request, TYPES, type ConnectionConfig } from "tedious";

const config: ConnectionConfig = {
  server: process.env.DB_HOST ?? "localhost",
  authentication: {
    type: "default",
    options: {
      userName: process.env.DB_USER ?? "sa",
      password: process.env.DB_PASSWORD ?? "yourStrong(!)Password"
    }
  },
  options: {
    database: process.env.DB_NAME ?? "SpaceBooking",
    encrypt: true,
    trustServerCertificate: true,
    instanceName: process.env.DB_INSTANCE
  }
};

const createConnection = () =>
  new Promise<Connection>((resolve, reject) => {
    const connection = new Connection(config);
    connection.on("connect", (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(connection);
    });
    connection.connect();
  });

export const execute = async <T = Record<string, unknown>>(
  sql: string,
  parameters: { name: string; type: typeof TYPES[keyof typeof TYPES]; value: unknown }[] = []
) => {
  const connection = await createConnection();
  return new Promise<T[]>((resolve, reject) => {
    const rows: T[] = [];
    const request = new Request(sql, (err) => {
      connection.close();
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
    parameters.forEach((param) => request.addParameter(param.name, param.type, param.value));
    request.on("row", (columns) => {
      const row = columns.reduce<Record<string, unknown>>((acc, column) => {
        acc[column.metadata.colName] = column.value;
        return acc;
      }, {});
      rows.push(row as T);
    });
    connection.execSql(request);
  });
};

export const executeTransaction = async <T>(
  handler: (connection: Connection) => Promise<T>
): Promise<T> => {
  const connection = await createConnection();
  return new Promise<T>((resolve, reject) => {
    connection.beginTransaction(async (err) => {
      if (err) {
        connection.close();
        reject(err);
        return;
      }
      try {
        const result = await handler(connection);
        connection.commitTransaction((commitErr) => {
          connection.close();
          if (commitErr) {
            reject(commitErr);
            return;
          }
          resolve(result);
        });
      } catch (error) {
        connection.rollbackTransaction(() => {
          connection.close();
          reject(error as Error);
        });
      }
    });
  });
};

export const execSql = async <T>(
  connection: Connection,
  sql: string,
  parameters: { name: string; type: typeof TYPES[keyof typeof TYPES]; value: unknown }[] = []
) =>
  new Promise<T[]>((resolve, reject) => {
    const rows: T[] = [];
    const request = new Request(sql, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
    parameters.forEach((param) => request.addParameter(param.name, param.type, param.value));
    request.on("row", (columns) => {
      const row = columns.reduce<Record<string, unknown>>((acc, column) => {
        acc[column.metadata.colName] = column.value;
        return acc;
      }, {});
      rows.push(row as T);
    });
    connection.execSql(request);
  });
