# Mini Sentry

A self-hosted front-end error monitoring system — SDK + API + Dashboard.

## Stack

| Layer | Tech |
|---|---|
| SDK | TypeScript + tsup |
| API | Fastify + Prisma + PostgreSQL |
| Rate limit | Redis + @fastify/rate-limit |
| Dashboard | Next.js 15 + Tailwind |
| Infra (local) | Docker Compose |

## Setup

### 1. Prerequisites

```bash
node >= 20
pnpm >= 9
docker + docker-compose
```

### 2. Start infrastructure

```bash
docker compose up -d
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/dashboard/.env.example apps/dashboard/.env.local
```

### 5. Run database migrations

```bash
pnpm db:push
```

### 6. Start everything

```bash
# Two separate terminals:
pnpm dev:api        # http://localhost:3001
pnpm dev:dashboard  # http://localhost:3000
```

### 7. Create your first project

Open http://localhost:3000 → **New project** → copy the API key.

---

## SDK usage

```bash
npm install @mini-sentry/browser
```

```ts
import { initErrorTracker, captureException, setUser } from '@mini-sentry/browser';

initErrorTracker({
  endpoint: 'http://localhost:3001/api/v1/ingest',
  apiKey: 'YOUR_API_KEY',
  appName: 'my-app',
  environment: 'production',
  version: '1.0.0',
  enableHttpTracking: true,
  enableConsoleCapture: false,
});

// After login:
setUser({ id: 'user-123' });

// Manual capture:
try {
  riskyOperation();
} catch (err) {
  captureException(err);
}
```

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/ingest` | Receive events from the SDK |
| `GET` | `/api/v1/projects` | List projects |
| `POST` | `/api/v1/projects` | Create project |
| `GET` | `/api/v1/projects/:id/errors` | List error groups |
| `GET` | `/api/v1/projects/:id/errors/:gid` | Error group detail |
| `GET` | `/api/v1/projects/:id/errors/:gid/events` | Recent events for group |
| `PATCH` | `/api/v1/projects/:id/errors/:gid` | Update status (open/resolved/ignored) |

---

## Architecture

```
packages/
  sdk/        ← @mini-sentry/browser (npm package)
  shared/     ← shared TypeScript types

apps/
  api/        ← Fastify API (port 3001)
  dashboard/  ← Next.js dashboard (port 3000)
```

## Source maps (Fase 5)

Upload source maps after each build so the dashboard shows original file names and line numbers instead of minified code.

### 1. Configure your build tool to generate source maps

**Vite:**
```ts
// vite.config.ts
export default { build: { sourcemap: true } }
```

**webpack:**
```js
// webpack.config.js
module.exports = { devtool: 'source-map' }
```

### 2. Pass `version` to `initErrorTracker`

```ts
initErrorTracker({
  // ...
  version: '1.4.2',  // must match --version in the CLI command
});
```

### 3. Upload source maps after build

```bash
# Install CLI as a dev dependency
npm install -D @mini-sentry/cli

# Upload after build
npx @mini-sentry/cli sourcemaps \
  --api-url http://localhost:3001 \
  --api-key YOUR_API_KEY \
  --version 1.4.2 \
  --dir ./dist
```

The dashboard will then show desminified stacks highlighted in green.

---

## Publish to npm

```bash
# SDK
cd packages/sdk
pnpm build
npm publish --access public

# CLI
cd packages/cli
pnpm build
npm publish --access public
```

---

## Roadmap

- [x] Source maps upload + stack trace desminification
- [ ] Performance monitoring (Web Vitals, slow requests)
- [ ] React Error Boundary helper package
- [ ] Vue plugin
- [ ] Occurrence histogram in error detail
- [ ] Alerting (email/Slack webhook)
