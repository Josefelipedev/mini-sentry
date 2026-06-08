# @mini-sentry/vue

Vue 3 plugin for [Mini Sentry](https://github.com/YOUR_ORG/mini-sentry).

## Install

```bash
npm install @mini-sentry/vue @mini-sentry/browser
```

## Usage

```ts
import { createApp } from 'vue';
import { MiniSentryPlugin } from '@mini-sentry/vue';
import App from './App.vue';

const app = createApp(App);

app.use(MiniSentryPlugin, {
  endpoint: 'https://sentry.yourcompany.com/api/v1/ingest',
  apiKey: 'YOUR_API_KEY',
  appName: 'my-vue-app',
  environment: 'production',
  version: '1.0.0',
});

app.mount('#app');
```

The plugin:
- Calls `initErrorTracker` with your config
- Registers `app.config.errorHandler` to capture all component and lifecycle errors

For manual captures, import directly from `@mini-sentry/browser`:

```ts
import { captureException, setUser } from '@mini-sentry/browser';
```

## Requirements

Vue 3 only.
