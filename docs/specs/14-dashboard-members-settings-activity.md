# 14 - Dashboard, Members, Settings, And Activity

## Linked Issues

- GitHub #11: Slice 10 - Replace placeholder dashboard with live MTO metrics
- GitHub #12: Slice 11 - Add member invitation and role management
- GitHub #13: Slice 12 - Add organization settings and audit activity timeline

## Goal

Complete the workspace management layer after the core order-to-production flow exists.

## Dashboard Scope

- Active order counts.
- Production bottlenecks.
- Outstanding invoices.
- Product counts.
- Recent activity.
- Useful empty states for new organizations.

## Member Scope

- Invite members by email and role.
- Update member roles according to permission rules.
- Enforce Owner, Admin, Member, and Operator surface visibility.
- Use server functions, TanStack Form, and shadcn primitives.

## Settings And Activity Scope

- Basic organization settings.
- Activity events for order transitions, task movement, invoice changes, payment recording, and member actions.
- Activity shown on order detail and dashboard surfaces where useful.
- Long activity lists rendered efficiently with TanStack Virtual when needed.

## Acceptance Criteria

- Dashboard metrics come from org-scoped server functions.
- Members and Operators see only allowed navigation and actions.
- Owners and permitted Admins can invite members and update roles.
- Owners and Admins can update basic organization settings.
- Important domain events create activity records.
- Activity lists remain performant for long histories.
- Tests cover metrics, member permissions, settings updates, activity creation, visibility, and org isolation.
