# Database

> **Rules:** [`../rules/database.md`](../rules/database.md) — non-negotiables, checklists, common mistakes.

## Schema Conventions

- IDs use `crypto.randomUUID()`
- Timestamps use `timestamp({ withTimezone: true }).defaultNow().notNull()`
- Add your own tenant column (e.g. `orgId`) when multi-tenancy is needed.

## Drizzle Queries

```typescript
import { db } from '#/db/index'
import { eq, and, ilike, inArray, desc, sql } from 'drizzle-orm'
import { myTable } from '#/db/schema'

// Select — always narrow columns
const items = await db
  .select({ id: myTable.id, name: myTable.name })
  .from(myTable)

// Insert
const [item] = await db.insert(myTable).values({ id: crypto.randomUUID(), ... }).returning()

// Update
const [item] = await db.update(myTable).set({ name: 'new' }).where(eq(myTable.id, id)).returning()

// Delete
await db.delete(myTable).where(eq(myTable.id, id))
```

## Column Narrowing

Always select only the columns you need:

```typescript
// ❌ Fetches ALL columns
db.select().from(table)

// ✅ Fetches only what's needed
db.select({ id: table.id, name: table.name }).from(table)
```

## Search Patterns

### Prefix Search (`term%`) — B-tree Index
```sql
CREATE INDEX idx_table_name ON table_name (name);
```
```typescript
const pattern = `${searchTerm}%`
db.select({ ... }).from(table).where(ilike(table.name, pattern))
```

### Substring Search (`%term%`) — pg_trgm + GIN
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_table_name_trgm ON table_name USING GIN (name gin_trgm_ops);
```
```typescript
const pattern = `%${searchTerm}%`
db.select({ ... }).from(table).where(ilike(table.name, pattern))
```

### Full-Text Search
```typescript
index('search_idx').using('gin', sql`to_tsvector('english', ${table.content})`)

const results = await db
  .select({ id: table.id, title: table.title, rank: sql`ts_rank(...)` })
  .from(table)
  .where(sql`to_tsvector('english', ${table.content}) @@ plainto_tsquery('english', ${searchTerm})`)
  .orderBy((t) => desc(t.rank))
```

## Batch Patterns (N+1 Prevention)

```typescript
// Batch insert
await db.insert(table).values(items)

// Batch select
const items = await db.select().from(table).where(inArray(table.id, ids))

// Batch update with transaction
await db.transaction(async (tx) => {
  for (const item of items) {
    await tx.update(table).set({ ... }).where(eq(table.id, item.id))
  }
})
```

## Migrations

```bash
bun run db:generate   # Generate migration from schema changes
bun run db:migrate    # Apply migrations
bun run db:push       # Push schema directly (dev only)
bun run db:studio     # Open Drizzle Studio
```

## Key Rules

- Import `db` from `#/db/index` only
- Use Drizzle query builder, never raw SQL
- Always narrow `db.select()` to specific columns
- Run migrations through Drizzle, never direct schema changes
- Never use `LIKE '%term%'` without a corresponding `pg_trgm` GIN index
- Never loop over DB queries when a batch operation would work
