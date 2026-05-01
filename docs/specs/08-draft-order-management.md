# 08 - Draft Order Management

## Linked Issue

- GitHub #5: Slice 4 - Create draft orders from customers and products

## Goal

Allow Admins to create draft orders by selecting a customer, adding product line items, calculating totals, and saving notes and requirements.

## Scope

- Draft order create and edit form.
- Customer selection from org-scoped customers.
- Product and variant selection from active catalog items.
- Line item add, update, and remove behavior.
- Order total calculation through the pricing engine.
- Manual price override when permitted.
- Org-scoped order list with URL-backed filters.

## Order States In Scope

- `draft`
- `pending`
- `approved`
- `production`
- `in_delivery`
- `completed`
- `cancelled`
- `rejected`

Draft order management creates and updates `draft` orders only. Later specs handle customer submission and lifecycle transitions.

## Acceptance Criteria

- Admins can create a draft order for an existing customer.
- Admins can add, update, and remove line items.
- Totals come from product pricing rules with permitted overrides.
- Draft orders appear in an org-scoped order list.
- Order forms use TanStack Form and shadcn Field components.
- Tests cover draft creation, line item changes, pricing totals, and org isolation.
