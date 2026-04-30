import * as schema from './schema'

export const db = await (async () => {
  const databaseUrl = process.env.DATABASE_URL

  if (databaseUrl) {
    const { Pool } = await import('pg')
    const pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 3000,
    })
    try {
      const client = await pool.connect()
      client.release()
      const { drizzle } = await import('drizzle-orm/node-postgres')
      return drizzle(pool, { schema })
    } catch {
      await pool.end().catch(() => {})
    }
  }

  const { PGlite } = await import('@electric-sql/pglite')
  const { drizzle } = await import('drizzle-orm/pglite')
  const client = new PGlite()
  const { ddl } = await import('./seed')
  for (const sql of ddl) await client.exec(sql)
  return drizzle(client, { schema })
})()
