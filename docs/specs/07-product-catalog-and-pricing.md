# 07 - Product Catalog And Pricing

## Linked Issue

- GitHub #4: Slice 3 - Add product catalog with pricing breakpoints

## Goal

Let Admins define MTO products, variants, production requirements, and quantity pricing breakpoints with a tested pricing preview.

## Scope

- Product create and edit forms.
- Product variants for size, material, color, or configuration.
- Active/inactive products.
- Production requirement notes attached to products or variants.
- Quantity pricing breakpoints.
- Pricing preview backed by the pricing engine.
- URL-backed product list search and filters.

## Pricing Engine

Treat pricing as a deep module with a small interface.

- Calculate unit price from quantity breakpoints.
- Interpolate between configured breakpoints when required.
- Support permitted manual overrides.
- Return line totals and order totals in a predictable money representation.
- Return explicit errors for missing prices and invalid quantities.

## Acceptance Criteria

- Admins can create and edit products and variants.
- Admins can mark products active or inactive.
- Admins can configure pricing breakpoints.
- Pricing preview uses the same module as order calculation.
- Product list supports URL-backed search and filters.
- Tests cover breakpoint calculations, overrides, product CRUD, and org isolation.
