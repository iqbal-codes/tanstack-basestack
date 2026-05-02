# 18 - Address & Biteship Integration

## Goal

Implement address management with Biteship area search integration for Indonesian addresses. Addresses are stored globally (for Biteship area lookup) and per-organization (for customer/order shipping).

## Domain Language

| Term | Meaning |
|---|---|
| **Biteship area** | Indonesian subdistrict, district, city, province, and postal code stored in `biteship_areas` for area search. |
| **WNI/WNA** | Indonesian citizen (Warga Negara Indonesia) vs foreign national (Warga Negara Asing). WNI requires area selection; WNA does not. |
| **Address** | Per-org shipping address with area reference and street address. |
| **Shipping address** | JSONB field on orders containing area and street data for delivery. |

## Scope

- `biteship_areas` global lookup table (country-level, not org-scoped).
- `addresses` table: per-org address with area reference and street address.
- `address_id` column on `customers` (FK to `addresses`).
- `shipping_address` JSONB column on `orders`.
- `is_wni` column on `customers` (boolean, default true).
- Server functions for CRUD on addresses, area search, customer address prefilling.
- AddressSection UI component with WNI/WNA toggle and area search field.
- Auto-create/update customer address when saving order address.

## Out Of Scope

- Biteship API integration (only stores areas, no live shipping calculation).
- Address autocomplete from Biteship API (static area data only).

## Database Changes

### New Table: `biteship_areas`

```sql
CREATE TABLE biteship_areas (
  area_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subdistrict TEXT NOT NULL,
  district TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL
);
CREATE INDEX idx_biteship_areas_name ON biteship_areas(name);
CREATE INDEX idx_biteship_areas_postal ON biteship_areas(postal_code);
```

### New Table: `addresses`

```sql
CREATE TABLE addresses (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  area_id TEXT REFERENCES biteship_areas(area_id),
  area_name TEXT,
  street_address TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Columns Added to `customers`

```sql
ALTER TABLE customers ADD COLUMN address_id TEXT REFERENCES addresses(id) ON DELETE SET NULL;
ALTER TABLE customers ADD COLUMN is_wni BOOLEAN NOT NULL DEFAULT TRUE;
```

### Columns Added to `orders`

```sql
ALTER TABLE orders ADD COLUMN shipping_address JSONB;
```

## Server Functions

- `searchAreas(query: string)` — search biteship_areas by name or postal code, return up to 20 results.
- `createAddressFn(input)` — create per-org address with WNI/WNA validation.
- `updateAddressFn(id, input)` — update address.
- `prefillOrderAddress(customerId, orgId)` — fetch customer's saved address for order form.
- `updateCustomerAddress(customerId, addressId, isWni)` — update customer's address and is_wni.

## i18n Keys (namespace: `address`)

```ts
address: {
  title: 'Address'
  areaSearch: 'Search area...'
  areaSearchPlaceholder: 'Search subdistrict, district, city, or postal code'
  noResults: 'Area not found'
  streetAddress: 'Street Address'
  streetAddressPlaceholder: 'e.g. Jl. Raya Bogor No. 123'
  saveAsCustomerAddress: 'Save as customer address'
  isWni: 'Indonesian (WNI)'
  isWna: 'Foreign (WNA)'
  areaNotSupported: 'Shipping calculation not available for WNA customers'
  orgAddressRequired: 'Please set your organization address to continue'
  areaNotFound: 'Area not found. Please check the area name.'
  defaultAddress: 'Default address'
}
```

## Tests

- `src/features/address/model.test.ts`:
  - `createAddressFn` creates address with area.
  - `createAddressFn` rejects WNI without area.
  - `createAddressFn` allows WNA without area.
  - `searchAreas` returns up to 20 results.
  - `searchAreas` matches by name or postal code.

## Acceptance Criteria

- `biteship_areas` table exists with name, subdistrict, district, city, province, postal_code.
- `addresses` table exists with org_id, area_id, street_address.
- `customers` has `address_id` and `is_wni` columns.
- `orders` has `shipping_address` JSONB column.
- Server functions for address CRUD and area search work.
- AddressSection component renders with WNI/WNA toggle and area search.
- `bun run check`, `bun run typecheck`, `bun run test`, `bun run build` all pass.