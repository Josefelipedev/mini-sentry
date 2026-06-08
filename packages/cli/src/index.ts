import { program } from 'commander';
import { uploadSourceMaps } from './upload';

program
  .name('mini-sentry-upload')
  .description('Mini Sentry CLI — manage source maps and releases')
  .version('0.0.1');

program
  .command('sourcemaps')
  .description('Upload source maps to Mini Sentry after a production build')
  .requiredOption(
    '--api-url <url>',
    'Mini Sentry API URL (e.g. https://sentry.yourcompany.com)'
  )
  .requiredOption('--api-key <key>', 'Project API key (from the dashboard)')
  .requiredOption(
    '--version <version>',
    'App version / release identifier (must match the version passed to initErrorTracker)'
  )
  .requiredOption(
    '--dir <path>',
    'Directory that contains the built .js.map files (e.g. ./dist, ./build/static/js)'
  )
  .option('--ext <ext>', 'Source map file extension to look for', '.js.map')
  .option('--dry-run', 'Print what would be uploaded without actually uploading', false)
  .option('--verbose', 'Print each file as it is uploaded', false)
  .addHelpText(
    'after',
    `
Examples:

  # Vite / Rollup build (default output in dist/)
  $ mini-sentry-upload sourcemaps \\
      --api-url https://sentry.yourcompany.com \\
      --api-key abc123 \\
      --version 1.4.2 \\
      --dir ./dist

  # Create React App (source maps in build/static/js/)
  $ mini-sentry-upload sourcemaps \\
      --api-url https://sentry.yourcompany.com \\
      --api-key abc123 \\
      --version $npm_package_version \\
      --dir ./build/static/js

  # Preview what would be uploaded
  $ mini-sentry-upload sourcemaps --dry-run --api-url ... --api-key ... --version 1.4.2 --dir ./dist

Integration in package.json:
  "scripts": {
    "build": "vite build",
    "upload-sourcemaps": "mini-sentry-upload sourcemaps --api-url $API_URL --api-key $MINI_SENTRY_KEY --version $npm_package_version --dir ./dist"
  }
`
  )
  .action(uploadSourceMaps);

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error('Error:', String(err));
  process.exit(1);
});
