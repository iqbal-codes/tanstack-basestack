# 06 - Customer Registry

## Linked Issue

- GitHub #3: Slice 2 - Add customer registry

## Goal

Allow Admins to create, edit, search, and reuse customers when preparing Made-To-Order work.

## Scope

- Org-scoped customer list.
- Customer create and edit forms.
- Basic contact and business identity fields.
- URL-backed search and filters through `nuqs`.
- Responsive table and mobile card views through the Application Data Table.

## Data Shape

Customer records should support the first order flow without becoming a full CRM.

- Name or business name.
- Email.
- Phone.
- Address or delivery notes when needed.
- Internal notes.
- Active/inactive state if required by order creation.

## Acceptance Criteria

- Admins can create and edit customers.
- Customers are scoped to the current organization.
- Search state is URL-backed and restorable.
- Forms use TanStack Form and shadcn Field components.
- Lists use shadcn primitives and work on desktop and mobile.
- Tests cover create, edit, search behavior, and org isolation.
