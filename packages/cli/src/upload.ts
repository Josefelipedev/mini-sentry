import { readdir, readFile, stat } from 'fs/promises';
import { join, basename } from 'path';

export interface UploadOptions {
  apiUrl: string;
  apiKey: string;
  version: string;
  dir: string;
  ext: string;
  dryRun: boolean;
  verbose: boolean;
}

interface UploadResult {
  file: string;
  status: 'ok' | 'skipped' | 'error';
  reason?: string;
}

export async function uploadSourceMaps(options: UploadOptions): Promise<void> {
  const { apiUrl, apiKey, version, dir, ext, dryRun, verbose } = options;

  // Verify directory exists
  try {
    const s = await stat(dir);
    if (!s.isDirectory()) {
      console.error(`✗ ${dir} is not a directory`);
      process.exit(1);
    }
  } catch {
    console.error(`✗ Directory not found: ${dir}`);
    process.exit(1);
  }

  const allFiles = await readdir(dir, { recursive: true });
  const mapFiles = allFiles
    .map((f) => String(f))
    .filter((f) => f.endsWith(ext))
    .sort();

  if (mapFiles.length === 0) {
    console.log(`No *${ext} files found in ${dir}`);
    return;
  }

  console.log(`Found ${mapFiles.length} source map file(s) in ${dir}`);
  if (dryRun) console.log('[dry-run mode — no files will be uploaded]\n');

  const endpoint = `${apiUrl.replace(/\/$/, '')}/api/v1/releases/${encodeURIComponent(version)}/sourcemaps`;
  const results: UploadResult[] = [];

  for (const relPath of mapFiles) {
    const absPath = join(dir, relPath);
    // The JS filename is the map file name without the trailing .map
    const jsFilename = basename(relPath, '.map');

    if (dryRun) {
      console.log(`  [dry-run] ${relPath} → ${jsFilename}`);
      results.push({ file: relPath, status: 'skipped', reason: 'dry-run' });
      continue;
    }

    let content: string;
    try {
      content = await readFile(absPath, 'utf-8');
    } catch (err) {
      console.error(`  ✗ Could not read ${relPath}: ${String(err)}`);
      results.push({ file: relPath, status: 'error', reason: String(err) });
      continue;
    }

    // Basic validation before upload
    try {
      const parsed = JSON.parse(content) as Record<string, unknown>;
      if (parsed.version !== 3) {
        console.warn(`  ⚠ ${relPath} — not a Source Map v3, skipping`);
        results.push({ file: relPath, status: 'skipped', reason: 'not v3' });
        continue;
      }
    } catch {
      console.warn(`  ⚠ ${relPath} — invalid JSON, skipping`);
      results.push({ file: relPath, status: 'skipped', reason: 'invalid JSON' });
      continue;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ filename: jsFilename, content }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body}`);
      }

      if (verbose) {
        const bytes = Buffer.byteLength(content, 'utf-8');
        console.log(`  ✓ ${relPath} (${jsFilename}, ${formatBytes(bytes)})`);
      } else {
        process.stdout.write('.');
      }
      results.push({ file: relPath, status: 'ok' });
    } catch (err) {
      console.error(`\n  ✗ ${relPath}: ${String(err)}`);
      results.push({ file: relPath, status: 'error', reason: String(err) });
    }
  }

  if (!verbose && !dryRun) process.stdout.write('\n');

  const ok = results.filter((r) => r.status === 'ok').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const errors = results.filter((r) => r.status === 'error').length;

  console.log(`\nDone: ${ok} uploaded, ${skipped} skipped, ${errors} errors`);
  console.log(`Version: ${version} | Endpoint: ${endpoint}`);

  if (errors > 0) process.exit(1);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
