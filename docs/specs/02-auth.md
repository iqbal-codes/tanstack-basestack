# 02 — Authentication

> Extend Better Auth with organization, access control, 2FA, SSO, admin, and impersonation plugins.

## Current State

```ts
// src/lib/auth.ts
export const auth = betterAuth({
  appName: "BaseStack", // → rename to 'BaseStack'
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  plugins: [tanstackStartCookies()],
});
```

## Target State

```ts
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { organization } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins";
import { admin } from "better-auth/plugins";
import { username } from "better-auth/plugins";
import { passkey } from "better-auth/plugins";
import { openApi } from "better-auth/plugins";
import { db } from "#/db/index";
import * as schema from "#/db/schema";
import {
  ac,
  owner,
  admin as adminRole,
  member,
} from "#/features/rbac/permissions";

export const auth = betterAuth({
  appName: "BaseStack",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  emailVerification: {
    enabled: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        template: "verify-email",
        data: { url },
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [
    tanstackStartCookies(),
    organization({
      ac,
      roles: { owner, admin: adminRole, member },
      teams: { enabled: true },
      organizationHooks: {
        afterCreateOrganization: async ({ organization, member }) => {
          // Auto-seed default workspace, create Stripe customer, etc.
          await setupDefaultWorkspace(organization.id, member.userId);
        },
      },
      async sendInvitationEmail(data) {
        await sendEmail({
          to: data.email,
          template: "org-invitation",
          data: {
            inviteLink: `${process.env.APP_URL}/accept-invitation/${data.id}`,
            orgName: data.organization.name,
            inviterName: data.inviter.user.name,
          },
        });
      },
    }),
    twoFactor({
      issuer: "BaseStack",
    }),
    admin({
      defaultRole: "admin",
      adminRolePermissions: ["all"],
    }),
    username(),
    passkey(),
    openApi(),
  ],
});
```

## Auth Client

```ts
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { twoFactorClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { passkeyClient } from "better-auth/client/plugins";
import { ac, owner, admin, member } from "#/features/rbac/permissions";

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      ac,
      roles: { owner, admin, member },
    }),
    twoFactorClient(),
    adminClient(),
    passkeyClient(),
  ],
});
```

## Session Helper (extended)

```ts
// src/lib/auth-session.ts
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";

export const getCurrentSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getRequestHeaders(),
    });
    return session;
  },
);

export const getActiveOrganization = createServerFn({ method: "GET" }).handler(
  async () => {
    const org = await auth.api.getFullOrganization({
      headers: getRequestHeaders(),
    });
    return org;
  },
);

export const getUserPermissions = createServerFn({ method: "GET" }).handler(
  async () => {
    const member = await auth.api.getActiveMember({
      headers: getRequestHeaders(),
    });
    return member?.role ?? null;
  },
);
```

## Route Guards

### Authentication guard (existing pattern, extended)

```ts
// beforeLoad in any protected route
beforeLoad: async ({ location }) => {
  const session = await getCurrentSession();
  if (!session) {
    throw redirect({ to: "/sign-in", search: { redirect: location.href } });
  }
  return { session };
};
```

### Organization guard

```ts
beforeLoad: async ({ params }) => {
  const org = await getActiveOrganization();
  if (!org || org.slug !== params.orgSlug) {
    throw redirect({ to: "/admin" });
  }
  return { org };
};
```

## Auth Form Enhancements

- Add Google/GitHub OAuth buttons
- Add "Forgot password" flow
- Add email verification flow
- Add 2FA setup in settings
- Add passkey (WebAuthn) registration in settings

## Migration

Run after adding organization plugin:

```bash
bun run db:generate
bun run db:migrate
```

Better Auth's organization plugin adds: `organization`, `member`, `invitation`, `team`, `teamMember` tables automatically via its schema.

## Checklist

- [ ] Rename `appName` to `BaseStack`
- [ ] Add `organization` plugin with teams enabled
- [ ] Add `twoFactor` plugin
- [ ] Add `admin` plugin
- [ ] Add `username` plugin
- [ ] Add `passkey` plugin (optional, nice to have)
- [ ] Add `openApi` plugin
- [ ] Configure OAuth providers (Google, GitHub)
- [ ] Wire `sendInvitationEmail` and `sendVerificationEmail`
- [ ] Extend `auth-client.ts` with client plugins
- [ ] Create `getActiveOrganization` and `getUserPermissions` server fns
- [ ] Add organization guard to tenant routes
- [ ] Update AuthForm with OAuth buttons + forgot password
- [ ] Run `db:generate` and `db:migrate`
