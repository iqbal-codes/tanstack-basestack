# PRD: Sub-Domain Multi-Organization

**Status:** needs-triage

## Problem Statement

LedgerPilot currently has a single workspace. All authenticated users share one global `/admin` dashboard with no isolation, no role boundaries, and no way to partition users into separate organizations. A user who signs up gets full access to the same admin console as every other user. This prevents the product from serving multiple independent companies, teams, or tenants under one deployment.

Users need to create and join organizations that are isolated from one another, each with its own members, roles, and sub-domain URL. The application must resolve the current organization from the request host header (`acme.app.com`), enforce membership and role-based access control, and keep the authentication session portable across organizations via a shared cookie domain.

## Solution

Introduce true sub-domain multi-tenancy powered by Better Auth's organization plugin. Every organization gets its own sub-domain (`acme.app.com`), a membership list with role-based access control, and an invitation system for onboarding new members. A global `app.com` surface handles sign-in, sign-up, org creation, org listing, org switching, and invitation acceptance. When a user visits an organization's sub-domain, a server-side request middleware resolves the organization by slug, validates the user's membership, syncs the active organization in their session, and makes the organization context available to all downstream route handlers and UI components.

## User Stories

### Authentication & Session

1. As an unauthenticated user, I want to sign up at `app.com/sign-up` with email and password, so that I can create an account on the platform.
2. As an unauthenticated user, I want to sign in at `app.com/sign-in` with email and password, so that I can access my organizations.
3. As an authenticated user, I want my session cookie to work across all sub-domains (`*.app.com`) without re-authenticating, so that I can switch between organizations seamlessly.
4. As an authenticated user, I want to sign out from any page and be redirected to the global sign-in page.
5. As a user who signed up, I want to be redirected to the global landing page after sign-in so that I can see my organizations or create my first one.

### Organization Creation & Onboarding

6. As a newly signed-up user with no organizations, I want to see a clear call-to-action to create my first organization, so that I understand the next step required to use the product.
7. As an authenticated user, I want to create an organization by providing a name and a URL-friendly slug at `app.com/orgs/new`, so that I can set up a workspace for my team.
8. As an authenticated user, I want to be automatically added as the owner of any organization I create, so that I have full administrative control over it.
9. As an authenticated user, I want to be redirected to my new organization's sub-domain dashboard immediately after creation, so that I can start working in context.
10. As an authenticated user, I want to see a list of all organizations I belong to at `app.com/`, so that I can switch between them or manage them.

### Sub-Domain Resolution & Routing

11. As an authenticated user, I want to visit `acme.app.com` and automatically enter the context of the "acme" organization, so that I don't need to manually select my workspace.
12. As an authenticated user, I want the server middleware to verify my membership in the organization before serving any organization-scoped content, so that unauthorized access is blocked.
13. As an authenticated user who is not a member of the requested organization, I want to be redirected to `app.com` with an access-denied explanation, so that I understand why I cannot access that sub-domain.
14. As an authenticated user, I want my active organization to be automatically updated when I visit a different organization's sub-domain, so that the active org always matches the URL I'm viewing.

### Organization Management

15. As an organization owner, I want to see my organization's name and logo in the sidebar header, so that I know which workspace I'm currently working in.
16. As an authenticated user with multiple organizations, I want to switch between organizations by selecting one from a dropdown in the sidebar, so that I can quickly change contexts.
17. As an authenticated user switching organizations, I want to be redirected to the new organization's sub-domain immediately upon selection, so that the URL always reflects my current workspace.
18. As an organization owner, I want to update my organization's name, slug, and logo, so that I can keep the organization's branding current.
19. As an organization owner, I want to delete my organization, so that I can remove workspaces that are no longer needed.

### Membership & Roles

20. As an organization owner or admin, I want to view a list of all members in my organization, showing their name, email, and role, so that I can manage who has access.
21. As an organization owner or admin, I want to change a member's role (e.g., promote from member to admin), so that I can delegate administrative responsibilities.
22. As an organization owner or admin, I want to remove a member from the organization, so that I can revoke access when someone leaves.
23. As an organization member, I want to see my own role in the current organization, so that I understand what actions I'm permitted to take.
24. As an organization member, I want to leave an organization, so that I can remove myself from workspaces I no longer need.
25. As an organization owner, I want to be prevented from leaving my own organization (transfer ownership first), so that the organization is never left without an owner.
26. As a user with the member role, I want to be restricted from creating, updating, or deleting resources, so that role-based access control is enforced.

### Invitations

27. As an organization owner or admin, I want to invite a new user to my organization by entering their email address and assigning a role, so that I can onboard team members.
28. As an invited user, I want to receive an invitation link that I can use to accept the invitation, so that I can join the organization.
29. As an invited user, I want to be able to see the invitation details (organization name, inviter, role) before accepting, so that I know what I'm agreeing to.
30. As an invited user, I want to accept an invitation and be automatically added as a member of the organization, so that I can start collaborating.
31. As an invited user, I want to be able to reject an invitation, so that I can decline unwanted organization access.
32. As an organization owner or admin, I want to cancel a pending invitation, so that I can revoke an invite that was sent in error.
33. As an organization owner or admin, I want to see a list of all pending invitations for my organization, so that I can track who has been invited and follow up.

### Access Control

34. As a developer, I want a permission system based on roles so that I can guard server-side and client-side operations.
35. As an organization owner, I want to have full control over the organization including the ability to delete it and assign any role to any member.
36. As an organization admin, I want to manage members and invitations but be prevented from deleting the organization.
37. As an organization member, I want to view organization data but be prevented from modifying settings or managing members.

### Dashboard (Org-Scoped)

38. As an authenticated member of an organization, I want to access the dashboard overview at my org's sub-domain root, so that I can see organization-specific metrics and data.
39. As an authenticated member of an organization, I want all data displayed in the dashboard (users table, system settings, actions) to be scoped to my current organization, so that I only see my own organization's information.

### Developer Experience

40. As a developer, I want to test sub-domain routing locally using `*.localhost:3000` without any DNS configuration, so that I can develop and debug organization features.
41. As a developer, I want the invitation link to be logged to the server console during development, so that I can test the invitation flow without an email provider.

## Implementation Decisions

### Multi-Tenancy Architecture

- **True sub-domain multi-tenancy**: each organization is accessed via its own sub-domain (e.g., `acme.app.com`). This provides tenant isolation, clean branding, and the option to split per-tenant later.
- **Global apex domain**: `app.com` serves landing, sign-in, sign-up, org management, and invitation acceptance. No organization context at the apex.
- **Auth cookie domain**: session cookie is set on `.app.com` so it's shared across all sub-domains. A single sign-in works everywhere.
- **Sub-domain drives active org**: the URL is the source of truth. Visiting `acme.app.com` means "I'm working in the acme organization." The middleware syncs this to the session.

### Database Schema

- Organization-related tables (`organization`, `member`, `invitation`, `organizationRole`) are defined manually in the Drizzle schema file, matching Better Auth's expected column names and types exactly. This keeps the schema self-documenting and gives typed query access via Drizzle's API.
- The existing `user` table remains unchanged — users are global and belong to organizations via the `member` join table.
- No extra columns beyond Better Auth's defaults are added to the organization table. Additional fields (plan, billing email, status) are stored in the `metadata` JSON column.
- Database migrations are managed through Drizzle Kit (`db:generate` and `db:migrate`).

### Sub-Domain Resolution Middleware

- A single composite request middleware is created in the application's start configuration. It runs for every incoming HTTP request.
- The middleware performs three steps in sequence: (1) extract the sub-domain from the request host header, (2) look up the organization by slug in the database and validate the user's membership, (3) sync the active organization in the user's session and inject the organization context.
- For apex domain requests (`app.com`), the middleware skips org resolution and passes through.
- For unknown sub-domains or non-members, the middleware returns a redirect to the apex domain.
- The middleware exposes resolved organization context (org ID, name, slug, member role) to downstream route handlers and server functions via TanStack Start's context propagation.

### Authentication & Organization Plugin

- Better Auth's organization plugin is enabled on both server and client. It handles organization CRUD, member CRUD, invitation lifecycle, and role-based access control.
- The `sendInvitationEmail` callback logs the invitation link to the server console. A real email provider will be integrated later.
- Cookie domain, trusted origins, and base URL are configured via environment variables (`COOKIE_DOMAIN`, `BETTER_AUTH_URL`, `TRUSTED_ORIGINS`) — not VITE_ prefixed, since they are server-only.
- Better Auth's default permission model is used as-is: `owner` (full control), `admin` (manage members/invitations), `member` (read-only).

### Route Architecture

- The route tree is unified — all routes live under a single file-based router. Global routes (both apex and org-scoped) coexist.
- Two layout routes are used: a global layout for apex routes with a minimal header and user menu, and an organization layout with a full sidebar, org switcher, and navigation.
- Before-load guards on organization-scoped routes check for the presence of organization context. If missing, the user is redirected to sign-in or the global landing page as appropriate.
- Organization-scoped routes live at the sub-domain root without an `/admin` prefix. The sub-domain itself communicates the context.
- Global routes include: sign-in, sign-up, org creation, org listing, org management, invitation acceptance, and the Better Auth API handler.

### Organization Switching

- When a user selects a different organization in the sidebar dropdown, the application performs a full-page navigation (window.location redirect) to the new sub-domain. No API call to set the active organization is needed — the middleware on the new sub-domain handles that automatically.
- The sidebar org switcher displays the current organization's name and logo. The dropdown lists all organizations the user belongs to, fetched via Better Auth's `useListOrganizations` hook.
- The active organization is highlighted in the dropdown. Selecting a new organization triggers the redirect.

### Onboarding Flow

- After successful sign-up or sign-in, the user is redirected to `app.com/` — a landing page that serves as an org picker.
- If the user has no organizations, the landing page shows a call-to-action to create their first organization.
- The org creation form at `app.com/orgs/new` asks for a name and a URL-friendly slug. On success, the user is redirected to their new org's sub-domain.
- If the user has existing organizations, the landing page lists them. Clicking one redirects to that org's sub-domain.

### Local Development

- `*.localhost` resolves to `127.0.0.1` natively on macOS and most Linux distributions. No `/etc/hosts` changes or third-party services are needed.
- The middleware strips the port number from the host header during sub-domain extraction (e.g., `acme.localhost:3000` → sub-domain `acme`).
- The cookie domain is set to `.localhost` in development and `.app.com` in production.

### UI Components

- **OrgSwitcher**: replaces the existing hardcoded TeamSwitcher. Displays current org in the sidebar header, dropdown lists all orgs with redirect on select. Uses `useListOrganizations` and `useActiveOrganization` from Better Auth's client plugin.
- **OrgPicker** (landing page): lists all user's orgs as cards with name and member count. Shows "Create your first organization" CTA when empty. Respects `?redirect=` search param.
- **OrgCreateForm**: TanStack Form with name and slug fields. Slug is validated for uniqueness via `authClient.organization.checkSlug` on blur. On success, creates org and redirects.
- **GlobalHeader**: minimal shell for apex routes — logo, user avatar dropdown, sign-out.
- **OrgSidebar**: existing sidebar component extracted to org layout. Navigation items re-pointed to org-scoped routes without the `/admin` prefix.
- **MemberList**: table displaying organization members with their role, status, and actions (remove, change role). Fetched via `authClient.organization.listMembers`.
- **InvitationList**: table of pending invitations with cancel action. Send invitation form with email and role fields.

### Role Language

- The existing "Operator" role in seed data and types is renamed to "member" to align with Better Auth's default role vocabulary.
- Translations and type definitions are updated to use `owner`, `admin`, `member` consistently.

### Feature Flag

- A `VITE_ENABLE_ORGANIZATIONS` environment variable gates the organization feature. When disabled (the initial state), the existing single-workspace behavior is preserved. When enabled, the sub-domain middleware and org-scoped routes activate. This allows incremental development and testing without breaking the existing app.

## Testing Decisions

### Test Philosophy

- Tests verify externally observable behavior, not implementation details. A good test asserts that given certain inputs, the system produces the expected output, side effect, or redirect.
- Tests should fail when the contract changes but should not fail when the implementation is refactored.
- Prior art in this project: Vitest runner, with the existing `bun run test` script running `vitest run --passWithNoTests`.

### Modules to Test

**Sub-domain resolution middleware** (deep module)

This is the highest-priority test target. The middleware is testable in isolation because it receives a request-like object and returns either context or a redirect response. The database layer and session layer are mocked.

Test cases:
- A request to the apex domain returns no org context and proceeds normally.
- A request to a valid sub-domain with an authenticated user who is a member returns the correct org context (id, name, slug, member role).
- A request to a valid sub-domain with an authenticated user who is NOT a member returns a redirect to the apex.
- A request to an unknown sub-domain (no matching org in database) returns a redirect to the apex.
- A request to a sub-domain from an unauthenticated user returns a redirect to sign-in.
- The middleware correctly handles a host header with a port number.
- The middleware correctly handles a host header with no sub-domain (bare `localhost:3000`).
- The middleware correctly sets the active organization in the user's session when the sub-domain differs from the current active organization.

**Organization creation form** (user-facing validation)

Test cases:
- Form validates that name is required and meets minimum length.
- Form validates that slug is required, URL-safe, and meets minimum length.
- Form shows an error when the slug is already taken (mock the check-slug API).
- Form calls the create organization API with correct payload on valid submission.
- Form shows a loading state while the API call is in progress.
- Form shows an error message when the API returns an error.
- On successful creation, the user is redirected to the new organization's sub-domain.

### Modules Not Tested (Relied On)

- Better Auth's organization plugin: tested upstream. We test our integration points (form calls, client hooks, middleware session sync) but not Better Auth internals.
- Drizzle schema: schema correctness is verified by `db:generate` producing valid SQL, not by unit tests.
- UI layout and styling: tested visually during development, not via automated tests.

## Out of Scope

- **Custom domains per organization** (e.g., bringing your own `acme.com`). This requires DNS verification, SSL provisioning, and domain ownership validation.
- **Billing integration** for paid organization plans. The schema and architecture accommodate billing-ready metadata, but no payment processor is integrated.
- **Organization-level API keys** for programmatic access.
- **Cross-organization data sharing or federation** between organizations.
- **Organization transfer of ownership** workflow. The owner role exists and can be assigned, but no guided "transfer ownership" flow is built.
- **Email provider integration** for sending invitation emails. Invitation links are logged to the server console during development.
- **Organization activity audit logs** (who did what and when within an organization).
- **Granular custom permissions** beyond Better Auth's default `owner`/`admin`/`member` roles. Custom RBAC with domain-specific resources (billing, forecasting, etc.) will be layered on later.
- **Organization-level feature flags** that allow different organizations to have different feature sets.
- **SSO / SAML / OAuth** for organization-level authentication.
- **Organization branding customization** beyond name, slug, and logo.
- **Team sub-groups within organizations** (Better Auth's teams feature is available but not enabled yet).

## Further Notes

- The existing PGlite in-memory fallback database for local development supports all organization DDL. No Neon connection is required to develop and test organization features.
- Better Auth's organization plugin already handles all organization, member, and invitation API endpoints. We do not write custom API routes for these — we call Better Auth's client methods which route through the existing `/api/auth/*` handler.
- The `isIgnoredPath` function in the i18n utility must be updated to reflect the new route structure. Routes no longer use the `/admin` prefix; org-scoped routes are at the sub-domain root.
- All new UI strings must be added to the internationalization message files (English and Indonesian) under new top-level keys: `org`, `members`, `invitations`, `landing`.
- The TanStack DB local-only collections used for dashboard state (actions, signals) will eventually be scoped per-organization, but the seed data in them can remain shared during this phase.
- Environment variables required: `BETTER_AUTH_URL`, `COOKIE_DOMAIN`, `TRUSTED_ORIGINS`, and `VITE_ENABLE_ORGANIZATIONS`.
