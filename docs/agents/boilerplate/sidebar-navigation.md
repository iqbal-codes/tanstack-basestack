# Sidebar & Navigation

## App Sidebar (`src/components/app-sidebar.tsx`)

Standard sidebar layout with:
- `NavUser` — user avatar/name dropdown with sign-out

## Nav Items Pattern

Nav items use lucide icons and route paths:

```typescript
const items = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
]
```

## Layout Composition (`_protected.tsx`)

```tsx
<SidebarProvider>
  <AppSidebar user={user} />
  <SidebarInset>
    <header>
      <SidebarTrigger />
      <Breadcrumbs />
      <ThemeToggle />
      <LanguageToggle />
    </header>
    <Outlet />
  </SidebarInset>
</SidebarProvider>
```

The header reads `pageTitle` from leaf route context for mobile display.
