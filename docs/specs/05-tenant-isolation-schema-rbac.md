# 05 - Tenant Isolation, Domain Schema, And RBAC Foundation

## Linked Issues

- Foundation for GitHub #2 through #13
- GitHub #12: Slice 11 - Add member invitation and role management

## Goal

Define the minimum Pabriq data contract and permission model needed before building org-scoped MTO features.

## Domain Tables

Every business table must carry organization ownership and be RLS-ready.

- `customers`
- `products`
- `product_variants`
- `pricing_breakpoints`
- `orders`
- `order_line_items`
- `customer_tokens`
- `invoices`
- `payments`
- `workflow_stages`
- `production_tasks`
- `activity_events`

## Roles

- Owner: full organization control, billing-ready settings, members, all domain actions.
- Admin: operational control over customers, products, orders, workflow, production, invoices, and settings.
- Member: limited create/read access according to workspace permissions.
- Operator: production-only visibility and allowed task stage transitions.

## Permission Modules

Keep permissions as a deep module with a small interface.

- `canManageMembers(role)`
- `canManageProducts(role)`
- `canCreateOrders(role)`
- `canApproveOrders(role)`
- `canManageInvoices(role)`
- `canAdvanceProductionTask(role, task)`
- `canViewProduction(role)`

## Isolation Rules

- Server functions resolve organization context from the authenticated membership.
- Workspace list and mutation functions never trust client-provided organization IDs.
- RLS policies or equivalent query constraints must prevent cross-organization reads and writes.
- Customer token flows are scoped by token, not user session, and cannot cross into workspace resources.

## Acceptance Criteria

- Domain schema matches Pabriq concepts, not generic ERP modules.
- All business tables are organization-owned.
- Role checks support Owner, Admin, Member, and Operator behavior.
- Operator navigation can be restricted to production surfaces.
- Tests cover permission outcomes and org isolation at server boundaries.
