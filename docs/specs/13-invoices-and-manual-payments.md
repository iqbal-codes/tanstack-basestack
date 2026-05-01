# 13 - Invoices And Manual Payments

## Linked Issue

- GitHub #10: Slice 9 - Add invoices and manual bank transfer payments

## Goal

Track invoices and manual bank transfer payments for approved orders without integrating a payment processor.

## Scope

- Create invoice for approved order.
- Invoice list and order-linked invoice visibility.
- Manual bank transfer payment recording.
- Invoice states: paid, partially paid, void, overdue.
- Payment instructions shown on customer token pages when relevant.

## Out Of Scope

- Stripe.
- Card payments.
- Payment webhooks.
- Refunds.
- Automatic reconciliation.

## Acceptance Criteria

- Admins can create invoices for approved orders.
- Admins can record manual bank transfer payment events.
- Invoices can become paid, partially paid, void, or overdue.
- Invoice state is visible from order detail and invoice lists.
- Customer token pages can show payment instructions when relevant.
- Tests cover invoice state changes, payment recording, order linkage, and org isolation.
