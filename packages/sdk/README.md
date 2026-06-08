# @mini-sentry/browser

Lightweight browser SDK for [Mini Sentry](https://github.com/YOUR_ORG/mini-sentry) — a self-hosted front-end error monitoring system.

**~4KB gzip** · Zero runtime dependencies · ESM + CJS + IIFE

---

## Install

```bash
npm install @mini-sentry/browser
# or
pnpm add @mini-sentry/browser
# or
yarn add @mini-sentry/browser
```

---

## Quick start

```ts
import { initErrorTracker } from '@mini-sentry/browser';

initErrorTracker({
  endpoint: 'https://your-api.example.com/api/v1/ingest',
  apiKey: 'YOUR_API_KEY',
  appName: 'my-app',
  environment: 'production',
  version: '1.4.2',
});
```

Call `initErrorTracker` once, as early as possible in your app entry point. After that, all unhandled errors and promise rejections are captured automatically.

---

## Configuration

```ts
initErrorTracker({
  // Required
  endpoint: 'https://your-sentry.example.com/api/v1/ingest',
  apiKey: 'YOUR_PROJECT_API_KEY',
  appName: 'checkout-web',

  // Recommended
  environment: 'production',      // default: 'production'
  version: '1.4.2',               // used to match source maps

  // Optional
  release: 'deploy-2026-06-08',   // CI run / git SHA / deploy tag
  userId: 'user-123',             // set before login if known
  sampleRate: 0.5,                // capture 50% of events (default: 1)
  maxBreadcrumbs: 50,             // default: 50
  enableHttpTracking: true,       // track fetch/XHR failures (default: true)
  enableConsoleCapture: false,    // capture console.error (default: false)
  enablePerformance: false,       // track slow requests (default: false)
  slowRequestThreshold: 2000,     // ms — only relevant if enablePerformance: true
  beforeSend: (event) => {
    // Modify or filter events before they are sent.
    // Return null to drop the event entirely.
    if (event.url.includes('/health')) return null;
    return event;
  },
});
```

---

## Manual capture

```ts
import { captureException, captureMessage } from '@mini-sentry/browser';

// Capture a caught error with optional metadata
try {
  await processPayment(cart);
} catch (err) {
  captureException(err, { cartId: cart.id, userId: user.id });
}

// Capture a plain message
captureMessage('Payment gateway timeout', { gateway: 'stripe' });
```

---

## User identification

```ts
import { setUser, clearUser } from '@mini-sentry/browser';

// After login
setUser({ id: user.id });

// After logout
clearUser();
```

---

## Custom breadcrumbs

```ts
import { addBreadcrumb } from '@mini-sentry/browser';

// Add a manual breadcrumb to record important steps
addBreadcrumb({
  type: 'manual',
  category: 'cart',
  message: 'User applied coupon',
  data: { coupon: 'SAVE10', discount: 10 },
  timestamp: Date.now(),
});
```

---

## Source maps

For production stacks to show **original file names and line numbers** instead of minified code, upload your source maps after each build using the companion CLI:

```bash
npx @mini-sentry/cli sourcemaps \
  --api-url https://your-api.example.com \
  --api-key YOUR_API_KEY \
  --version 1.4.2 \
  --dir ./dist
```

The `version` must match exactly what you pass to `initErrorTracker`.

### CI/CD integration

**GitHub Actions (Vite):**

```yaml
- name: Build
  run: npm run build

- name: Upload source maps
  run: |
    npx @mini-sentry/cli sourcemaps \
      --api-url ${{ secrets.SENTRY_API_URL }} \
      --api-key ${{ secrets.SENTRY_API_KEY }} \
      --version ${{ github.sha }} \
      --dir ./dist
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**package.json scripts:**

```json
{
  "scripts": {
    "build": "vite build",
    "upload-sourcemaps": "mini-sentry-upload sourcemaps --api-url $API_URL --api-key $SENTRY_KEY --version $npm_package_version --dir ./dist"
  }
}
```

---

## Framework integrations

### React — Error Boundary

```tsx
import { captureException } from '@mini-sentry/browser';
import React from 'react';

interface State { hasError: boolean }

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ReactNode }>,
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureException(error, {
      componentStack: info.componentStack ?? undefined,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <p>Something went wrong.</p>;
    }
    return this.props.children;
  }
}
```

Usage:

```tsx
<ErrorBoundary fallback={<ErrorScreen />}>
  <App />
</ErrorBoundary>
```

### Vue 3

```ts
import { initErrorTracker, captureException } from '@mini-sentry/browser';
import { createApp } from 'vue';
import App from './App.vue';

initErrorTracker({ endpoint: '...', apiKey: '...', appName: 'my-vue-app', version: '1.0.0' });

const app = createApp(App);

app.config.errorHandler = (err, _instance, info) => {
  captureException(err instanceof Error ? err : new Error(String(err)), { vueInfo: info });
};

app.mount('#app');
```

### Next.js (App Router)

In `app/global-error.tsx`:

```tsx
'use client';
import { captureException } from '@mini-sentry/browser';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <html>
      <body><h2>Something went wrong</h2></body>
    </html>
  );
}
```

---

## What is captured automatically

| Event | Captured by default |
|---|---|
| Unhandled JS errors (`TypeError`, `ReferenceError`, etc.) | ✅ |
| Unhandled promise rejections | ✅ |
| `fetch` / `XHR` failures (4xx, 5xx, network errors) | ✅ |
| Navigation breadcrumbs (route changes, history) | ✅ |
| Click breadcrumbs (buttons, links) | ✅ |
| `console.error` | ⚙️ opt-in (`enableConsoleCapture: true`) |
| Slow HTTP requests | ⚙️ opt-in (`enablePerformance: true`) |

---

## Throttle limits

The SDK applies client-side throttling to avoid flooding your API:

- Same error fingerprint: max **3 sends per minute**
- Per session: max **50 events total**
- Breadcrumbs: last **50** entries (configurable via `maxBreadcrumbs`)

---

## Browser support

ES2015+ (Chrome 51+, Firefox 54+, Safari 10+, Edge 15+). No IE11.

---

## License

MIT
