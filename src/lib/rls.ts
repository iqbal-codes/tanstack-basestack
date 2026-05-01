import { sql } from 'drizzle-orm'
import { db } from '#/db/index'

export async function setCurrentOrg(orgId: string) {
  await db.execute(sql`SELECT set_config('app.current_org_id', ${orgId}, true)`)
}

export async function resetCurrentOrg() {
  await db.execute(sql`SELECT set_config('app.current_org_id', '', true)`)
}

export function orgFilter(orgIdCol: string) {
  return sql`${sql.raw(orgIdCol)} = current_setting('app.current_org_id')`
}
