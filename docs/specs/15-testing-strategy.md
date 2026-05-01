# 15 - Testing Strategy

## Goal

Keep tests focused on Pabriq domain outcomes and user-visible behavior instead of implementation details.

## Required Test Areas

- Pricing calculations: totals, interpolation, breakpoints, overrides, missing prices, invalid quantities.
- Order lifecycle: allowed transitions, blocked transitions, role-sensitive transitions, and side effects.
- Workflow task spawning: approved orders create the right tasks in the right stages with useful context.
- Permissions: Owner, Admin, Member, and Operator can and cannot perform expected actions.
- Customer tokens: token scope, expiry, order access, confirmation, and blocked unrelated access.
- Onboarding: unauthenticated redirects, no-org onboarding, existing-org workspace routing.
- Server functions: business outcomes at API boundaries.
- RLS/data isolation: org-scoped queries never return another organization's rows.
- Forms: validation messages, disabled submit state, successful submission, and server error display.
- UI components: accessible labels, visible states, and user actions.

## Slice Coverage

Each feature spec must include tests for its acceptance criteria before the slice is considered complete.

Do not create broad snapshot tests for the workspace. Prefer focused tests around the deep modules and user-visible route behavior.

## Verification Commands

- `bun run check`
- `bun run build`
- Focused test command once the repository has a stable test script.

## Acceptance Criteria

- Deep modules have direct unit coverage.
- Route guards and server functions have integration-style coverage.
- Critical flows have visible behavior tests.
- Tests enforce tenant isolation and permission boundaries.
- New feature slices include regression tests for the bug-prone domain rules they introduce.
