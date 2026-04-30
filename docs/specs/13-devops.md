# 13 — DevOps

> Docker, GitHub Actions CI/CD, feature flags, environment management.

## Docker

### `Dockerfile`

```dockerfile
# Stage 1: Build
FROM oven/bun:1.3-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Stage 2: Production
FROM oven/bun:1.3-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/instrument.server.mjs ./dist/server/
RUN bun install --frozen-lockfile --production

EXPOSE 3000
ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["bun", "run", "start"]
```

### `docker-compose.yml`

```yaml
version: '3.9'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=${BETTER_AUTH_URL}
      - RESEND_API_KEY=${RESEND_API_KEY}
      - STORAGE_ENDPOINT=${STORAGE_ENDPOINT}
      - STORAGE_REGION=${STORAGE_REGION}
      - STORAGE_ACCESS_KEY_ID=${STORAGE_ACCESS_KEY_ID}
      - STORAGE_SECRET_ACCESS_KEY=${STORAGE_SECRET_ACCESS_KEY}
      - STORAGE_BUCKET=${STORAGE_BUCKET}
      - STORAGE_PUBLIC_URL=${STORAGE_PUBLIC_URL}
    depends_on:
      - redis
    restart: unless-stopped

  worker:
    build: .
    command: bun run src/workers/index.ts
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - RESEND_API_KEY=${RESEND_API_KEY}
      - STORAGE_ENDPOINT=${STORAGE_ENDPOINT}
      - STORAGE_REGION=${STORAGE_REGION}
      - STORAGE_ACCESS_KEY_ID=${STORAGE_ACCESS_KEY_ID}
      - STORAGE_SECRET_ACCESS_KEY=${STORAGE_SECRET_ACCESS_KEY}
      - STORAGE_BUCKET=${STORAGE_BUCKET}
      - STORAGE_PUBLIC_URL=${STORAGE_PUBLIC_URL}
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

## GitHub Actions CI/CD

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: '1.3'
      - run: bun install --frozen-lockfile
      - run: bun run check

  test:
    name: Test
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: basestack_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/basestack_test
      REDIS_URL: redis://localhost:6379
      BETTER_AUTH_SECRET: test-secret-at-least-32-characters-long
      BETTER_AUTH_URL: http://localhost:3000
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: '1.3'
      - run: bun install --frozen-lockfile
      - run: bun run db:migrate
      - run: bun run test

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: '1.3'
      - run: bun install --frozen-lockfile
      - run: bun run build
```

### `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: '1.3'

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build
        run: bun run build

      - name: Run migrations
        run: bun run db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      # Platform-specific deploy step (example for Railway)
      - name: Deploy to Railway
        uses: railwayapp/railway-deploy@v2
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}

      # Or Docker-based deploy (example for Fly.io)
      # - uses: superfly/flyctl-actions/setup-flyctl@master
      # - run: flyctl deploy --remote-only
      #   env:
      #     FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

      - name: Create Sentry release
        run: |
          curl -sL https://sentry.io/get-cli/ | bash
          sentry-cli releases new ${{ github.sha }}
          sentry-cli releases set-commits --auto ${{ github.sha }}
          sentry-cli releases finalize ${{ github.sha }}
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}

      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v2
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK }}
          webhook-type: incoming-webhook
          payload: |
            text: "Deploy failed for ${{ github.repository }} on ${{ github.ref_name }}"
```

## Feature Flags

### `src/features/flags/service.ts`

```ts
// Simple JSON-based feature flags (upgrade to LaunchDarkly/Flagsmith later)
const flags = JSON.parse(process.env.FLAGS_JSON || '{}')

export function isFeatureEnabled(flag: string): boolean {
  return flags[flag] === true
}

export function getFeatureFlag<T>(flag: string, defaultValue: T): T {
  return flags[flag] ?? defaultValue
}

// Usage
if (isFeatureEnabled('beta.search')) {
  // Show new search UI
}
```

## Environment Management

### `.env.example` (expanded)

Already documented in `00-overview.md`. The project already has a good `.env.example`.

### Environment validation

```ts
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  DATABASE_URL_POOLER: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.enum(['development', 'preview', 'production']).default('development'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
})

// Validate on startup
export function validateEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten())
    process.exit(1)
  }
}
```

## Package Scripts (extended)

```json
{
  "scripts": {
    "dev": "dotenv -e .env.local -- sh -c \"NODE_OPTIONS='--import ./instrument.server.mjs' vite dev --port 3000\"",
    "build": "vite build && cp instrument.server.mjs dist/server",
    "start": "node --import ./dist/server/instrument.server.mjs dist/server/server.js",
    "worker": "bun run src/workers/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "check": "biome check .",
    "format": "biome format --write .",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "docker:build": "docker build -t basestack .",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down"
  }
}
```

## Checklist

- [ ] Create `Dockerfile` with multi-stage build
- [ ] Create `docker-compose.yml` with app + worker + redis
- [ ] Create `.github/workflows/ci.yml` with lint → test → build
- [ ] Create `.github/workflows/deploy.yml` with migration → deploy → Sentry release
- [ ] Create `src/features/flags/service.ts` with feature flags
- [ ] Create `src/lib/env.ts` with environment validation
- [ ] Add `worker` script to package.json
- [ ] Add Docker scripts to package.json
- [ ] Configure GitHub repository secrets
- [ ] Set up deployment target (Railway, Fly.io, Render, VPS, etc.)
- [ ] Set up Slack/Discord deploy notifications
- [ ] Add pre-commit hook (Biome format + check)?
