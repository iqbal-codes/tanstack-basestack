# Testing

> **Rules:** [`../rules/verification.md`](../rules/verification.md) — pre-commit pipeline, non-negotiables.

## Infrastructure

- Vitest + happy-dom + @testing-library/react
- Globals enabled (`describe`, `it`, `expect`, `beforeEach`)
- Setup imports `@testing-library/jest-dom/vitest` + mocks `window.matchMedia`

## Pattern 1: Deep Module Unit Tests

Pure functions, no React rendering:

```typescript
it('parses email correctly', () => {
  expect(parseEmail('test@example.com')).toBe('test')
})
```

## Pattern 2: Component Tests (with i18n)

Wrap in `IntlProvider` with test messages:

```typescript
function renderWithIntl(ui: React.ReactElement) {
  return render(
    <IntlProvider locale="en" messages={{ status: { active: 'Active' } }}>
      {ui}
    </IntlProvider>,
  )
}

it('renders status badge', () => {
  renderWithIntl(<StatusBadge status="active" />)
  expect(screen.getByText('Active')).toBeInTheDocument()
})
```

## Pattern 3: Route Guard Tests

Mock router context and assert redirects:

```typescript
it('redirects unauthenticated users', async () => {
  await expect(
    Route.options.beforeLoad?.({ location: { href: '/protected' } } as any),
  ).rejects.toMatchObject({ to: '/sign-in' })
})
```

## Pattern 4: DB Integration Tests

Use real DB connection (requires `DATABASE_URL` in `.env.test`). Test server functions end-to-end.

## Test File Placement

Co-located with the file they test:
- `src/components/status-badge.test.tsx` tests `src/components/status-badge.tsx`

## Key Rules

- MUST place tests next to the file they test (co-location)
- MUST wrap i18n-dependent components in `IntlProvider`
- MUST NOT use snapshot tests for full pages
- MUST NOT use `jest` imports (use `vitest` globals)
