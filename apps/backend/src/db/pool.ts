import { Pool, PoolConfig } from 'pg';

const MAX_PRIMARY_CONNECTIONS = 20;
const MAX_REPLICA_CONNECTIONS = 20;

const primaryConfig: PoolConfig = {
  connectionString: resolveConnectionString(),
  max: clampPoolSize(process.env.DB_POOL_MAX, MAX_PRIMARY_CONNECTIONS, 20),
  min: Math.max(0, parseInt(process.env.DB_POOL_MIN ?? '2', 10)),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS ?? '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS ?? '2000', 10),
};

export const primaryPool = new Pool(primaryConfig);

const replicaConfig = buildReplicaConfig();
export const replicaPool = replicaConfig ? new Pool(replicaConfig) : null;

export function getReadPool(): Pool {
  return replicaPool ?? primaryPool;
}

function buildReplicaConfig(): PoolConfig | null {
  const replicaUrl = process.env.DATABASE_REPLICA_URL;
  if (!replicaUrl) {
    return null;
  }

  return {
    connectionString: replicaUrl,
    max: clampPoolSize(process.env.DB_REPLICA_POOL_MAX, MAX_REPLICA_CONNECTIONS, 10),
    idleTimeoutMillis: primaryConfig.idleTimeoutMillis,
    connectionTimeoutMillis: primaryConfig.connectionTimeoutMillis,
  };
}

function clampPoolSize(
  value: string | undefined,
  absoluteMax: number,
  defaultValue: number
): number {
  const parsed = parseInt(value ?? String(defaultValue), 10);
  if (Number.isNaN(parsed)) {
    return defaultValue;
  }
  return Math.max(1, Math.min(parsed, absoluteMax));
}

function resolveConnectionString(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.POSTGRES_USER ?? 'berthcare';
  const password = process.env.POSTGRES_PASSWORD ?? 'berthcare_dev_password';
  const host = process.env.POSTGRES_HOST ?? 'localhost';
  const port = process.env.POSTGRES_PORT ?? '5432';
  const database = process.env.POSTGRES_DB ?? 'berthcare_dev';

  const auth =
    password.length > 0
      ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
      : encodeURIComponent(user);

  return `postgresql://${auth}@${host}:${port}/${database}`;
}
