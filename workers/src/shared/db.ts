import { Pool } from '@neondatabase/serverless'

/**
 * Connects as `workers_service`, the Postgres role that replaces Supabase's
 * service_role for backend code. Requires `ALTER ROLE workers_service BYPASSRLS`
 * to have been run on the database (see wrangler.toml comment) — without it,
 * RLS still applies and most of these queries will see zero rows.
 */
export function dbPool(databaseUrl: string) {
  return new Pool({ connectionString: databaseUrl })
}
