# @mini-sentry/react

React integration for [Mini Sentry](https://github.com/YOUR_ORG/mini-sentry).

## Install

```bash
npm install @mini-sentry/react @mini-sentry/browser
```

## Quick start

### 1. Wrap your app with `ErrorTrackerProvider`

```tsx
import { ErrorTrackerProvider } from '@mini-sentry/react';

root.render(
  <ErrorTrackerProvider
    config={{
      endpoint: 'https://sentry.yourcompany.com/api/v1/ingest',
      apiKey: 'YOUR_API_KEY',
      appName: 'my-app',
      environment: 'production',
      version: '1.0.0',
    }}
  >
    <App />
  </ErrorTrackerProvider>
);
```

### 2. Add `ErrorBoundary` around components that might crash

```tsx
import { ErrorBoundary } from '@mini-sentry/react';

function App() {
  return (
    <ErrorBoundary fallback={<p>Something went wrong.</p>}>
      <Checkout />
    </ErrorBoundary>
  );
}
```

Custom fallback with error info:

```tsx
<ErrorBoundary
  fallback={(error) => <ErrorScreen message={error.message} />}
  onError={(error, info) => console.error(error, info)}
>
  <Dashboard />
</ErrorBoundary>
```

### 3. Manual capture with the hook

```tsx
import { useErrorTracker } from '@mini-sentry/react';

function PaymentForm() {
  const { captureException, setUser } = useErrorTracker();

  const handleSubmit = async () => {
    try {
      await processPayment();
    } catch (err) {
      captureException(err, { formId: 'payment' });
    }
  };
}
```

## API

| Export | Type | Description |
|---|---|---|
| `ErrorTrackerProvider` | Component | Initializes the SDK once on mount |
| `ErrorBoundary` | Component | Catches render errors and reports them |
| `useErrorTracker()` | Hook | Returns `{ captureException, captureMessage, setUser, clearUser }` |
