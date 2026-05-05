---
name: data-layer
description: Database patterns — Drizzle ORM queries, schema conventions, search optimization (prefix/substring/full-text), N+1 prevention, batch operations, migrations. Use when writing DB queries, adding tables, creating migrations, optimizing slow queries, or handling search/filter endpoints.
---

# Data Layer

## Non-Negotiables

- MUST import `db` from `#/db/index` only.
- MUST use Drizzle query builder (`db.select/insert/update/delete`) — never raw SQL.
- MUST use `crypto.randomUUID()` for new record IDs.
- MUST run DB changes through Drizzle migrations — never direct schema changes.
- MUST narrow `db.select()` to specific columns.
- MUST NOT use `LIKE '%term%'` without a `pg_trgm` GIN index.
- MUST NOT loop DB queries when batch operations work.
- MUST enforce minimum 3-char search for trigram-based (`%term%`) patterns.

## Schema Conventions

- IDs: `crypto.randomUUID()` (text/uuid)
- Timestamps: `timestamp({ withTimezone: true }).defaultNow().notNull()`
- Add your own tenant column (e.g. `orgId`) when you need multi-tenancy.

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

## Search Patterns

### Prefix Search (`term%`) — B-tree Index
```sql
CREATE INDEX idx_table_name ON table_name (name);
```
```typescript
const pattern = `${searchTerm}%`
db.select({ ... }).from(table).where(ilike(table.name, pattern))
```

### Substring Search (`%term%`) — GIN + pg_trgm
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_table_name_trgm ON table_name USING GIN (name gin_trgm_ops);
```
```typescript
const pattern = `%${searchTerm}%`
db.select({ ... }).from(table).where(ilike(table.name, pattern))
```

### Full-Text Search — GIN on tsvector
```typescript
index('search_idx').using('gin', sql`to_tsvector('english', ${table.content})`)

const results = await db
  .select({ id: table.id, title: table.title, rank: sql`ts_rank(...)` })
  .from(table)
  .where(sql`to_tsvector('english', ${table.content}) @@ plainto_tsquery('english', ${searchTerm})`)
  .orderBy((t) => desc(t.rank))
```

### Decision Table
| Pattern | Index | Min Length |
|---|---|---|
| `term%` (prefix) | B-tree | 1 |
| `%term%` (anywhere) | GIN + pg_trgm | 3 |
| Full-text (stemming) | GIN on tsvector | 1 |

## Batch Operations (N+1 Prevention)

### Batch Insert
```typescript
await db.insert(table).values(items)  // ✅ single query
```

### Batch Select
```typescript
const items = await db.select().from(table).where(inArray(table.id, ids))  // ✅ single query
```

### Batch Update
```typescript
await db.transaction(async (tx) => {
  for (const item of items) {
    await tx.update(table).set({ ... }).where(eq(table.id, item.id))
  }
})
```

## Migrations

```bash
bun run db:generate   # Generate from schema changes
bun run db:migrate    # Apply migrations
bun run db:push       # Push schema directly (dev only)
bun run db:studio    # Open Drizzle Studio
```

## References

See `docs/agents/rules/database.md` for detailed non-negotiables, checklists, and common mistakes.
