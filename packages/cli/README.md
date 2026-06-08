# @mini-sentry/cli

CLI for uploading source maps to [Mini Sentry](https://github.com/YOUR_ORG/mini-sentry).

---

## Install

```bash
# As a dev dependency (recommended)
npm install -D @mini-sentry/cli

# Or run directly with npx
npx @mini-sentry/cli sourcemaps --help
```

---

## Usage

```
mini-sentry-upload sourcemaps [options]

Options:
  --api-url <url>       Mini Sentry API URL (required)
  --api-key <key>       Project API key from the dashboard (required)
  --version <version>   App version — must match initErrorTracker({ version }) (required)
  --dir <path>          Directory containing .js.map files (required)
  --ext <ext>           File extension to look for (default: .js.map)
  --dry-run             Preview without uploading
  --verbose             Print each file as it uploads
```

---

## Examples

**Vite:**
```bash
mini-sentry-upload sourcemaps \
  --api-url https://sentry.yourcompany.com \
  --api-key abc123 \
  --version 1.4.2 \
  --dir ./dist
```

**Create React App:**
```bash
mini-sentry-upload sourcemaps \
  --api-url https://sentry.yourcompany.com \
  --api-key abc123 \
  --version $npm_package_version \
  --dir ./build/static/js
```

**Dry-run (preview only):**
```bash
mini-sentry-upload sourcemaps --dry-run \
  --api-url https://sentry.yourcompany.com \
  --api-key abc123 \
  --version 1.4.2 \
  --dir ./dist
```

---

## package.json integration

```json
{
  "scripts": {
    "build": "vite build",
    "upload-sourcemaps": "mini-sentry-upload sourcemaps --api-url $SENTRY_API_URL --api-key $SENTRY_API_KEY --version $npm_package_version --dir ./dist",
    "build:prod": "npm run build && npm run upload-sourcemaps"
  }
}
```

---

## GitHub Actions

```yaml
jobs:
  deploy:
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build

      - name: Upload source maps to Mini Sentry
        run: |
          npx @mini-sentry/cli sourcemaps \
            --api-url ${{ vars.SENTRY_API_URL }} \
            --api-key ${{ secrets.SENTRY_API_KEY }} \
            --version ${{ github.sha }} \
            --dir ./dist
```

---

## License

MIT
