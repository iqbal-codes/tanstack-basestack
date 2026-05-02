# 17 - Document Generation And PDF Download

## Goal

Build a reusable PDF generation and download pipeline that serves printable documents (quotations, invoices, SPK, etc.) via authenticated API routes. Scaffold the infrastructure once and apply it to each document type as the corresponding features are built.

## Domain Language

| Term | Meaning |
|---|---|
| **Document** | A server-rendered PDF. Not a stored asset — generated on-the-fly from live data. |
| **Template** | A `@react-pdf/renderer` React component that defines the layout, fields, and styling for one document type. Lives in `src/features/documents/templates/`. |
| **Document endpoint** | A TanStack Start API route under `/api/documents/` that returns raw PDF bytes with inline auth and org scoping. |
| **Organization profile** | Per-org business identity fields (display name, phone, logo) used in document headers. Stored in `organization_profiles`. |
| **Quote number** | Sequential per-org reference number (`QT-2026-001`) auto-assigned when a draft order is created. Stored on `orders`. |

## Scope

- Install `@react-pdf/renderer` and wire up server-side PDF generation.
- Create `organization_profiles` table: `display_name`, `phone`, `logo_asset_id` (FK to `assets`). One profile per org.
- Add `quote_number` (text, nullable, unique per org) and `valid_until` (timestamp, nullable) columns to `orders`.
- Auto-assign sequential per-org quote numbers when draft orders are created.
- Build shared PDF infrastructure in `src/features/documents/`:
  - `types.ts` — shared types for document data.
  - `server.ts` — auth helper (`resolveOrgForDocument`), PDF generation utilities.
  - `templates/quotation.tsx` — first template: quotation/proforma from order data.
- Create API route pattern: `GET /api/documents/orders/$id/quotation`.
- Inline session + org membership resolution in every document handler.
- A4 paper size, built-in fonts (Helvetica), on-the-fly generation (no R2 storage).
- Hardcoded placeholder T&C text and deferred tax display.

## Out Of Scope

- Invoice PDF (requires invoice feature — spec 13).
- SPK/work order PDF (requires production feature — specs 11, 12).
- Storing generated PDFs in R2.
- Per-org T&C configuration (deferred — hardcoded placeholder for v1).
- Tax/PPN calculation on documents (deferred — subtotal only for v1).
- Org address field on organization profiles (deferred refactor).
- Org-level terms_text field (deferred).
- UI download buttons (API endpoint only for this spec).
- Shareable/public document links (requires customer token integration).

## Architecture Decisions

### PDF engine: `@react-pdf/renderer`

- Pure JavaScript, runs on the Node server — no browser dependency.
- JSX-based templates match the React codebase.
- Trade-off: limited CSS support (Yoga layout — no grid, no Tailwind). Acceptable for structured business documents.

### On-the-fly generation, no storage

- PDFs are generated from live database data on each request.
- No R2 storage, no cache invalidation, no stale document concerns.
- Trade-off: slight latency per download (acceptable — these are not high-frequency endpoints).

### API routes, not `createServerFn`

- `GET /api/documents/orders/$id/quotation` returns raw PDF bytes.
- TanStack Start `server.handlers.GET` pattern (same as `/api/auth/$`).
- Direct URL access enables linking from emails and external systems in the future.
- Inline auth per handler resolves session and org membership.

### Sequential per-org quote numbers

- Format: `QT-YYYY-NNN` (e.g., `QT-2026-001`).
- Assigned when a draft order is created via `createDraftOrder`.
- Implementation: `SELECT MAX(quote_number) FROM orders WHERE org_id = $1` + 1, wrapped in a database transaction or advisory lock to prevent race conditions.
- Unique constraint: partial unique index or application-level enforcement on `(org_id, quote_number)` WHERE `quote_number IS NOT NULL`.

### Separate `organization_profiles` table

- Better Auth owns the `organization` table — extending it directly risks conflicts with future Better Auth migrations.
- `organization_profiles` has a 1:1 relationship with `organization` via `org_id` FK.
- Fields for v1: `display_name`, `phone`, `logo_asset_id` (FK to `assets`).
- `address` deferred to a later refactor of the org data model.
- `terms_text` deferred — hardcoded placeholder used in templates for v1.

## Database Changes

### New Table: `organization_profiles`

```sql
CREATE TABLE organization_profiles (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL UNIQUE REFERENCES organization(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  logo_asset_id TEXT REFERENCES assets(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Columns Added to `orders`

```sql
ALTER TABLE orders ADD COLUMN quote_number TEXT;
ALTER TABLE orders ADD COLUMN valid_until TIMESTAMP;
CREATE UNIQUE INDEX idx_orders_org_quote ON orders(org_id, quote_number)
  WHERE quote_number IS NOT NULL;
```

## File Structure

```
src/
├── features/
│   └── documents/
│       ├── types.ts              # DocumentTemplateProps, QuotationPdfData
│       ├── server.ts             # resolveOrgForDocument(), generatePdf()
│       └── templates/
│           └── quotation.tsx     # <QuotationDocument> @react-pdf/renderer component
├── routes/
│   └── api/
│       └── documents/
│           └── orders/
│               └── $id/
│                   └── quotation.ts   # GET handler
└── db/
    ├── schema.ts                 # +organization_profiles table, +orders columns
    └── seed.ts                   # +organization_profiles DDL
```

## Quotation Template Layout

A4 portrait, built-in Helvetica font.

| Section | Content | Data source |
|---|---|---|
| Header | Org display name + logo (right-aligned) | `organization_profiles` |
| Title | "QUOTATION" / "PENAWARAN" | Static |
| Metadata | Quote number, date, valid until | `orders.quote_number`, `orders.created_at`, `orders.valid_until` |
| Customer block | Customer name, email, phone, address | `customers` |
| Line items table | Product name, variant, qty, unit price, total | `orderLineItems` joined to `products` and `productVariants` |
| Pricing summary | Subtotal (grand total; tax row hidden for v1) | `orders.total` |
| T&C | Hardcoded placeholder text (Indonesian) | Static |
| Signatures | Company (left) + Customer (right) signature placeholder blocks | Static |

### Placeholder T&C Text

> Terima kasih atas kepercayaan Anda. Harga belum termasuk PPN. Pembayaran dilakukan melalui transfer bank ke rekening yang akan diinformasikan pada invoice. Penawaran ini berlaku sampai dengan tanggal yang tertera di atas. Spesifikasi dan harga dapat berubah tanpa pemberitahuan sebelumnya.

(English in `en` locale: "Thank you for your trust. Prices do not include VAT. Payment is made via bank transfer to the account specified on the invoice. This quotation is valid until the date stated above. Specifications and prices are subject to change without prior notice.")

## API Route Auth Pattern

Each document route handler:

1. Resolves the current session via `auth.api.getSession({ headers: getRequestHeaders() })`.
2. If no session → 401.
3. Resolves org membership from `member` table.
4. If no membership → 403.
5. Fetches the requested entity (order, invoice, etc.) scoped to the resolved `orgId`.
6. If not found or wrong org → 404.
7. Generates PDF from template → returns `Response` with `Content-Type: application/pdf`.

## API Route Pattern (TanStack Start)

```ts
// src/routes/api/documents/orders/$id/quotation.ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/documents/orders/$id/quotation')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        // 1. Auth check
        // 2. Fetch order + line items + customer + org profile
        // 3. Generate PDF via @react-pdf/renderer
        // 4. Return Response with application/pdf
      },
    },
  },
})
```

## Quote Number Generation (in `createDraftOrder`)

```ts
// Inside createDraftOrder, after validating customer exists:
const year = new Date().getFullYear()
const prefix = `QT-${year}-`

const existing = await db
  .select({ num: ordersTable.quote_number })
  .from(ordersTable)
  .where(
    and(
      eq(ordersTable.orgId, orgId),
      like(ordersTable.quote_number, `${prefix}%`),
    ),
  )
  .orderBy(desc(ordersTable.quote_number))
  .limit(1)

const nextNum = existing.length > 0
  ? Number.parseInt(existing[0].num!.split('-')[2]) + 1
  : 1
const quoteNumber = `${prefix}${String(nextNum).padStart(3, '0')}`
```

## i18n

No new translation keys required for this spec (API-only, no UI buttons). When download buttons are added to the UI later, add keys under a `documents` namespace:

- `documents.downloadQuotation`
- `documents.downloadInvoice`
- `documents.downloadSpk`

## Tests

- `src/features/documents/server.test.ts`:
  - `resolveOrgForDocument` returns org ID for authenticated user with membership.
  - `resolveOrgForDocument` throws for unauthenticated request.
  - `resolveOrgForDocument` throws for user with no org membership.
  - `generateQuotationPdf` returns a Buffer from valid order data.
  - `generateQuotationPdf` throws for nonexistent order.
  - PDF output contains expected text (quote number, customer name, product names).
- `src/features/orders/model.test.ts` (extend existing):
  - `createDraftOrder` auto-assigns sequential `quote_number` per org.
  - Quote numbers increment correctly across multiple orgs.
  - Quote numbers are unique per org.

## Acceptance Criteria

- `@react-pdf/renderer` installed and importable.
- `organization_profiles` table exists with `org_id` FK, `display_name`, `phone`, `logo_asset_id`.
- `orders` table has `quote_number` and `valid_until` columns.
- `createDraftOrder` auto-assigns sequential per-org quote numbers.
- `GET /api/documents/orders/$id/quotation` returns a valid PDF for an authenticated org member.
- PDF contains: org header, quote metadata, customer details, line items table, pricing summary.
- Unauthenticated requests to the endpoint return 401.
- Cross-org access (user from org A requesting org B's order) returns 404.
- PGlite seed DDL includes `organization_profiles`.
- `bun run check`, `bun run typecheck`, `bun run test`, and `bun run build` all pass.
- Drizzle migration generated via `bun run db:generate`.

## Future Extensibility

The `/api/documents/` route prefix accommodates future document types without restructuring:

```
GET /api/documents/orders/$id/quotation      ← this spec
GET /api/documents/invoices/$id              ← spec 13 (invoices)
GET /api/documents/production/$id/spk        ← spec 12 (kanban)
```

New templates follow the same pattern: create a template component in `src/features/documents/templates/`, add a route handler under `src/routes/api/documents/`, reuse `resolveOrgForDocument`.
