## Problem Statement

Made-To-Order businesses such as custom merchandise shops, printing houses, furniture workshops, clothing makers, and similar production operations run on fragmented tools. Owners and admins often need separate spreadsheets, chat threads, payment records, customer forms, production boards, and manual status updates to move one order from inquiry to delivery.

This creates operational gaps: order details are incomplete, product pricing is inconsistent, production tasks are hard to track, operators lack a focused shop-floor view, customers need repeated manual follow-up, and owners do not get a reliable picture of active orders, invoices, and production bottlenecks.

Pabriq should become the operating system for small and medium MTO organizations: one authenticated workspace for the business, one token-based order experience for customers, and one production flow that turns approved orders into actionable kanban tasks.

## Solution

Build Pabriq as an MTO SaaS platform for order intake, product catalog management, pricing, customer approval, invoice/payment tracking, and production execution.

The product should support an organization workspace with roles for Owner, Admin, Member, and Operator. Each organization owns its customers, products, orders, invoices, workflow stages, production tasks, settings, and members. In the current local development flow, a user has one organization and lands on the apex workspace after onboarding. The architecture should remain multi-tenant-ready through organization membership and org-scoped data isolation.

The core product flow is:

1. A new user signs up or signs in.
2. If the user has no organization, the user completes onboarding by entering the organization name.
3. Pabriq creates the organization and routes the user into the workspace.
4. An Admin defines products, pricing rules, and workflow stages.
5. An Admin creates a draft order for a customer.
6. The customer opens a secure token link to review order details, submit required data, and confirm the order.
7. The order moves through draft, pending, approved, production, in delivery, and completed states.
8. When approved, Pabriq creates production tasks based on the organization's workflow stages.
9. Operators see only the production surface and advance tasks through button-based stage transitions.
10. Owners and Admins monitor active orders, production bottlenecks, invoices, and customer activity from the dashboard.

## User Stories

1. As an Owner, I want to create an organization during onboarding, so that I can start using Pabriq without manual setup.
2. As an Owner, I want Pabriq to remember my organization after login, so that I land directly in my workspace.
3. As an Owner, I want each user to belong to one organization for the first version, so that the product remains simple while the business model is validated.
4. As an Owner, I want my organization's data isolated from other organizations, so that customer, order, invoice, and production information stays private.
5. As an Owner, I want to invite team members, so that admins, members, and operators can collaborate in the workspace.
6. As an Owner, I want to assign roles to members, so that each user sees only the capabilities they need.
7. As an Owner, I want to manage billing-ready organization data, so that Pabriq can support subscriptions later.
8. As an Owner, I want a dashboard summary of active orders, products, and invoices, so that I understand business health quickly.
9. As an Owner, I want to see production bottlenecks, so that I can identify where orders are getting delayed.
10. As an Owner, I want to see outstanding invoices, so that I can follow up on unpaid orders.
11. As an Owner, I want to configure organization settings, so that Pabriq matches my workshop's operating model.
12. As an Admin, I want to create and edit products, so that my team can quote and sell standard MTO items.
13. As an Admin, I want to define product variants, so that customers can order different sizes, materials, colors, or configurations.
14. As an Admin, I want to configure pricing breakpoints, so that Pabriq can interpolate prices consistently across quantities.
15. As an Admin, I want to attach production requirements to products, so that approved orders create the right production work.
16. As an Admin, I want to mark products as active or inactive, so that unavailable items do not appear in new orders.
17. As an Admin, I want to manage customers, so that repeat buyers can be reused across orders.
18. As an Admin, I want to create a draft order, so that I can prepare customer-specific order details before sending a confirmation link.
19. As an Admin, I want to add line items to an order, so that the order reflects what the customer wants to buy.
20. As an Admin, I want Pabriq to calculate order totals from product pricing rules, so that pricing stays consistent and less manual.
21. As an Admin, I want to override or adjust pricing when needed, so that custom commercial agreements remain possible.
22. As an Admin, I want to add notes and requirements to an order, so that production has enough context.
23. As an Admin, I want to generate a secure customer token link, so that the customer can review and confirm without creating an account.
24. As an Admin, I want to resend a customer token link, so that customers can recover access to their order review page.
25. As an Admin, I want a pending order queue, so that customer-submitted orders can be reviewed before approval.
26. As an Admin, I want to approve a pending order, so that production tasks can be created.
27. As an Admin, I want to reject or cancel an order, so that invalid or abandoned orders do not enter production.
28. As an Admin, I want to move an approved order into production, so that the team knows work has started.
29. As an Admin, I want to mark an order as in delivery, so that delivery status is visible to the team.
30. As an Admin, I want to complete an order, so that finished work is removed from active production views.
31. As an Admin, I want to see an order timeline, so that I understand what happened and when.
32. As an Admin, I want to view production tasks by order, so that I can inspect progress at the order level.
33. As an Admin, I want to view production tasks by stage, so that I can manage the workshop workload.
34. As an Admin, I want to configure workflow stages, so that Pabriq matches my production process.
35. As an Admin, I want to define a design review stage, so that design approval becomes part of the kanban workflow.
36. As an Admin, I want workflow stages to be ordered, so that tasks move through a clear production path.
37. As an Admin, I want workflow changes to affect future tasks safely, so that existing production work does not break unexpectedly.
38. As an Admin, I want to create invoices for approved orders, so that payment tracking is tied to the order lifecycle.
39. As an Admin, I want to record manual bank transfer payments, so that v1 can work without payment processor integration.
40. As an Admin, I want to mark invoices as paid, partially paid, void, or overdue, so that receivables are clear.
41. As an Admin, I want invoice status to affect order visibility, so that payment-sensitive work can be tracked properly.
42. As an Admin, I want to search and filter orders, so that I can find work by status, customer, due date, or product.
43. As an Admin, I want URL-backed filters, so that order and production views can be shared or restored.
44. As an Admin, I want tables and cards for resource lists, so that dense desktop workflows and smaller screens both work well.
45. As an Admin, I want long activity streams to render efficiently, so that the workspace remains responsive.
46. As a Member, I want to view products, customers, orders, and invoices according to my permissions, so that I can help without full admin access.
47. As a Member, I want to create permitted resources, so that basic team workflows do not require admin intervention.
48. As an Operator, I want to see only the production menu, so that my interface is focused on shop-floor execution.
49. As an Operator, I want to see tasks assigned to production stages, so that I know what work needs attention.
50. As an Operator, I want to advance a task with explicit buttons, so that production status changes are simple and reliable.
51. As an Operator, I want to see task instructions and order context, so that I can do the work correctly.
52. As an Operator, I want to see blocked or waiting tasks clearly, so that I do not waste time on work that cannot proceed.
53. As an Operator, I want stage transitions to be permission-controlled, so that only allowed users can update production state.
54. As a Customer, I want to open a secure order link without login, so that I can review my order quickly.
55. As a Customer, I want to confirm order details, so that the business knows the order is ready for review.
56. As a Customer, I want to provide required production information, so that the business has what it needs to fulfill the order.
57. As a Customer, I want to see order totals clearly, so that I understand what I am approving.
58. As a Customer, I want to see payment instructions for manual bank transfer, so that I know how to pay.
59. As a Customer, I want to see confirmation after submitting, so that I know the business received my approval.
60. As a Customer, I want token links to be secure and scoped to one order, so that my order data is protected.
61. As the system, I want every business table to carry organization ownership, so that tenant isolation can be enforced consistently.
62. As the system, I want server functions for internal API operations, so that business logic stays behind typed server boundaries.
63. As the system, I want forms to use TanStack Form, so that validation and submission behavior are consistent.
64. As the system, I want URL state to use nuqs, so that filters and search params are predictable.
65. As the system, I want user-facing text to be translatable, so that the product can support English and Indonesian from the beginning.
66. As the system, I want shadcn/ui primitives for interface elements, so that the UI remains consistent and accessible.
67. As the system, I want Sentry integration ready for production, so that runtime errors can be observed.
68. As the system, I want Neon and Drizzle migrations to define the database contract, so that schema changes are reviewable and repeatable.
69. As the system, I want focused tests around deep modules, so that pricing, order lifecycle, permissions, and task spawning stay correct as UI changes.
70. As an Owner, I want Pabriq to feel like a purpose-built MTO platform rather than a generic ERP, so that the product fits my business language and workflows.

## Implementation Decisions

- Build the product around the domain concepts Organization, Owner, Admin, Member, Operator, Customer, Product, Order, Invoice, Workflow Stage, Production Task, and Customer Token.
- Preserve Better Auth as the authentication, session, organization, membership, invitation, and role foundation.
- Keep the first user journey simple: sign in or sign up, onboard with organization name only, then route into the workspace.
- Keep one organization per user for the first product slice, while preserving the underlying multi-tenant schema and org membership model.
- Resolve the current workspace organization from membership in the local/apex flow rather than requiring subdomain navigation during development.
- Keep future production multi-tenancy compatible with organization slugs and org-scoped data, but avoid making local subdomain cookies a blocker for product progress.
- Use Row-Level Security-ready business tables with organization ownership for every domain table.
- Use server functions as the internal API boundary for auth-adjacent and business operations.
- Use TanStack Query for server-backed reads and cache invalidation across workspace surfaces.
- Use TanStack Form with shadcn Field components for onboarding, product forms, order intake, customer token forms, invoice updates, and settings forms.
- Use nuqs for URL-backed search, filters, pagination, and view state.
- Use shadcn/ui primitives and lucide-react icons for all UI composition.
- Use TanStack Table for tabular resource lists such as orders, products, customers, invoices, and members.
- Use TanStack Virtual for long activity streams, long order lists, and production task queues where needed.
- Use TanStack Store only for focused client preferences such as current dashboard view, workspace display preferences, or short-lived UI state that is not form state or URL state.
- Treat pricing as a deep module with a small interface that calculates line-item pricing, quantity breakpoints, interpolation, overrides, and order totals.
- Treat order lifecycle as a deep module with a small interface that validates transitions across draft, pending, approved, production, in delivery, completed, cancelled, and rejected states.
- Treat workflow/task spawning as a deep module with a small interface that turns approved order line items into production tasks based on configured workflow stages.
- Treat permission checks as a deep module that maps Better Auth roles to domain actions such as approving orders, editing invoices, managing members, and advancing production tasks.
- Treat customer token access as a deep module that validates token scope, expiry, and allowed actions without requiring a customer login.
- Create business schema for customers, products, product variants, pricing breakpoints, orders, order line items, customer tokens, invoices, payments, workflow stages, production tasks, and activity events.
- Keep manual bank transfers as the v1 payment model; payment processor integration is deferred.
- Keep kanban progression button-based instead of drag-and-drop to reduce accidental shop-floor state changes.
- Include design review as a normal workflow stage rather than a separate special-case module.
- Keep all user-facing strings routed through the translation system.
- Keep generated/demo surfaces separate from production MTO workspace surfaces.

## Testing Decisions

- Good tests should assert external behavior and domain outcomes, not implementation details.
- Pricing tests should assert totals, interpolation, quantity breakpoints, overrides, and edge cases such as missing prices or invalid quantities.
- Order lifecycle tests should assert allowed transitions, blocked transitions, role-sensitive transitions, and resulting side effects.
- Workflow/task spawning tests should assert that approved orders create the right production tasks in the right stages with the right order and product context.
- Permission tests should assert that Owner, Admin, Member, and Operator roles can and cannot perform expected domain actions.
- Customer token tests should assert token scope, expiry, order access, and blocked access to unrelated resources.
- Onboarding tests should assert that an authenticated user without an organization sees onboarding, an authenticated user with an organization lands in the workspace, and unauthenticated users are redirected to sign-in.
- Server function tests should assert business outcomes at the API boundary rather than component internals.
- Route tests should assert important redirects and rendered states for sign-in, sign-up, onboarding, and workspace shell.
- Form tests should assert validation messages, disabled submit state, successful submission behavior, and error display for user-visible forms.
- RLS/data isolation tests should assert that org-scoped queries never return another organization's rows.
- UI component tests should focus on accessible behavior, visible labels, and user actions rather than DOM structure.
- Prior art in the current codebase includes Vitest, React Testing Library, TanStack Router route guards, server functions, TanStack Form usage, and Biome checks.

## Out of Scope

- Payment processor integration, card payments, webhooks, refunds, and automatic reconciliation.
- Multi-organization switching for one user in the first product slice.
- Public marketplace or customer self-service catalog discovery.
- Drag-and-drop kanban interactions.
- Mobile native applications.
- Advanced inventory, procurement, accounting, payroll, or generic ERP modules.
- Full CRM automation and marketing campaigns.
- Automated shipping carrier integration.
- Complex manufacturing resource planning or machine scheduling optimization.
- Production-grade subdomain routing if local/apex workspace routing is sufficient for the first implementation slice.
- Email delivery service integration beyond placeholders for invitations and customer links.

## Further Notes

- Current implementation already includes the TanStack Start app shell, Better Auth email/password auth, organization tables, membership tables, invitation tables, onboarding, workspace guard, and a placeholder dashboard.
- Recent local development changed workspace routing to apex-first because localhost subdomain cookies are unreliable in modern Chrome. The product can still preserve organization slugs and remain multi-tenant-ready.
- The domain documentation still references the earlier subdomain-first architecture and should be updated when this PRD is triaged.
- All implementation should follow the project constraints: TanStack Form for forms, nuqs for URL params, createServerFn for internal APIs, shadcn/ui primitives, no raw HTML primitives when shadcn equivalents exist, no console logs, no unnecessary comments, and full translation coverage.
- This PRD is intentionally product-level. It should be broken into independently grabbable tracer-bullet issues before implementation.
