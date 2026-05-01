# 04 - Auth Onboarding And Workspace Shell

## Linked Issue

- GitHub #2: Slice 1 - Stabilize organization onboarding and workspace shell

## Goal

Create a stable first-run path where an authenticated Owner with no organization completes onboarding with only an organization name, lands in the apex workspace, and returns there on later sign-ins.

## Scope

- Email/password sign-up and sign-in through Better Auth.
- Authenticated route guard for workspace routes.
- Onboarding route for users without an organization.
- Organization creation with slug preservation and Owner membership.
- Apex workspace routing for local development.
- Workspace shell that resolves the current organization from membership.
- Translated visible text in English and Indonesian.

## Out Of Scope

- Multi-organization switching.
- Production subdomain routing as a blocker.
- OAuth, passkeys, 2FA, impersonation, and enterprise SSO.
- Email delivery integration beyond placeholders.

## Implementation Notes

- Use `createServerFn` for onboarding and workspace session operations.
- Use TanStack Form and shadcn Field components for onboarding forms.
- Do not pass raw `orgId` from the client for protected workspace data access.
- Keep organization slugs in the data model even when local routing is apex-first.

## Acceptance Criteria

- Unauthenticated users visiting workspace routes are redirected to sign-in with a safe redirect target.
- Authenticated users without an organization see onboarding.
- Onboarding creates an organization and Owner membership from a single organization name field.
- Authenticated users with an organization land directly in the workspace.
- Workspace shell exposes session and organization context to navigation.
- Route behavior is covered by visible-behavior tests.
