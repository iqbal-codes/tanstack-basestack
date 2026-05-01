# 09 - Customer Token Approval Portal

## Linked Issue

- GitHub #6: Slice 5 - Add secure customer order approval portal

## Goal

Allow external customers to review and confirm a scoped order through a secure token link without creating an account.

## Scope

- Admin generation of customer token links for draft orders.
- Token resend placeholder behavior without real email delivery requirement.
- Public token route that does not require authentication.
- Customer review of order line items, totals, notes, and required information.
- Customer confirmation that moves the order to `pending` review.
- Expired, invalid, or unrelated token handling.

## Token Access Module

Treat customer token access as a deep module with a small interface.

- Validate token existence.
- Validate expiry.
- Validate token-to-order scope.
- Return only customer-safe order data.
- Allow only token-safe actions.

## Acceptance Criteria

- Admins can generate and resend a secure token link.
- Customers can open the link without login.
- Customers only see the scoped order.
- Customers can submit confirmation and required information.
- Confirmation moves the order to pending review.
- Tests cover token scope, expiry, invalid tokens, confirmation, and blocked unrelated access.
