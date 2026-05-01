# 10 - Order Lifecycle Approvals

## Linked Issue

- GitHub #7: Slice 6 - Implement order lifecycle approvals

## Goal

Add a tested order lifecycle module and Admin review queue for pending orders.

## Scope

- Pending order queue.
- Approve, reject, and cancel transitions.
- Move approved orders into production.
- Mark orders in delivery.
- Complete orders.
- User-visible errors for invalid transitions.
- Timeline activity events for lifecycle changes.

## Lifecycle Module

Treat order lifecycle as a deep module with a small interface.

- Validate allowed transitions.
- Validate role-sensitive transitions.
- Return the next state and side effects to apply.
- Block invalid transitions deterministically.
- Keep transition rules independent from UI components.

## Acceptance Criteria

- Admins can review pending orders.
- Admins can approve, reject, or cancel according to lifecycle rules.
- Approved orders can move through production, in delivery, and completed states.
- Invalid transitions are blocked with user-visible errors.
- Order list and detail views show current state and timeline events.
- Tests cover allowed transitions, blocked transitions, role-sensitive transitions, and queue visibility.
