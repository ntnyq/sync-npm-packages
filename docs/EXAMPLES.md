# Usage Examples

This document provides practical examples of using `sync-npm-packages` in various scenarios.

## Basic Usage

### Single Package Sync

```ts
import { syncNpmPackages } from 'sync-npm-packages'

await syncNpmPackages('my-package', {
  target: 'npmmirror',
})
```

### Multiple Packages Sync

```ts
await syncNpmPackages(['package-a', 'package-b', 'package-c'], {
  target: 'npmmirror',
})
```

## Auto-Detection

### Basic Auto-Sync

Automatically detect and sync all packages in the current workspace:

```ts
import { syncNpmPackagesAuto } from 'sync-npm-packages'

await syncNpmPackagesAuto({
  target: 'npmmirror',
})
```

### Monorepo with Custom Directory

```ts
await syncNpmPackagesAuto({
  target: 'npmmirror',
  cwd: './packages',
})
```

### With Ignore Patterns

```ts
await syncNpmPackagesAuto({
  target: 'npmmirror',
  ignore: ['**/private/**', '**/internal/**', '**/test-packages/**'],
})
```

## Advanced Options

### High Reliability Setup

For production environments with unreliable networks:

```ts
await syncNpmPackagesAuto({
  target: 'npmmirror',
  retry: 10, // Retry up to 10 times
  retryDelay: 2000, // Wait 2 seconds before first retry
  timeout: 30000, // 30 second timeout per request
  concurrency: 3, // Lower concurrency to reduce pressure
  verbose: true, // Show detailed progress
})
```

### Fast Sync for Stable Networks

When network is stable and you want speed:

```ts
await syncNpmPackagesAuto({
  target: 'npmmirror',
  retry: 2, // Only retry twice
  retryDelay: 500, // Quick retry
  timeout: 5000, // Fail fast
  concurrency: 20, // High concurrency
})
```

### Silent Mode for CI

Perfect for CI/CD pipelines:

```ts
await syncNpmPackagesAuto({
  target: 'npmmirror',
  silent: true, // No console output
})
```

### Debug Mode

For troubleshooting:

```ts
await syncNpmPackagesAuto({
  target: 'npmmirror',
  debug: true, // Show detailed debug info
  verbose: true, // Show all operations
})
```

## CLI Examples

### Basic Commands

```bash
# Basic sync
sync-npm-packages --target npmmirror

# With specific directory
sync-npm-packages --target npmmirror --cwd ./packages

# Dry run to see what would be synced
sync-npm-packages --target npmmirror --dry
```

### Performance Tuning

```bash
# High concurrency for faster sync
sync-npm-packages --target npmmirror --concurrency 20

# Conservative settings for unreliable networks
sync-npm-packages --target npmmirror \
  --retry 10 \
  --retry-delay 3000 \
  --concurrency 3 \
  --timeout 30000

# Quick sync with minimal retries
sync-npm-packages --target npmmirror \
  --retry 1 \
  --concurrency 15
```

### Output Control

```bash
# Verbose mode for detailed progress
sync-npm-packages --target npmmirror --verbose

# Silent mode for scripts
sync-npm-packages --target npmmirror --silent

# Debug mode for troubleshooting
sync-npm-packages --target npmmirror --debug --verbose
```

### Filtering Packages

```bash
# Exclude specific packages
sync-npm-packages --target npmmirror --exclude "@scope/private-pkg"

# Include additional packages not in workspace
sync-npm-packages --target npmmirror --include "external-package"

# Custom ignore patterns
sync-npm-packages --target npmmirror --ignore "**/test/**" --ignore "**/fixtures/**"

# Disable default ignore patterns
sync-npm-packages --target npmmirror --no-default-ignore
```

## Config File Examples

### Minimal Config

```ts
// sync.config.ts
import { defineConfig } from 'sync-npm-packages'

export default defineConfig({
  target: 'npmmirror',
})
```

### Production Config

```ts
// sync.config.ts
import { defineConfig } from 'sync-npm-packages'

export default defineConfig({
  target: 'npmmirror',

  // Paths
  cwd: './packages',

  // Filtering
  ignore: ['**/private/**', '**/internal/**'],
  exclude: ['@company/secret-package'],

  // Performance
  retry: 5,
  retryDelay: 2000,
  concurrency: 8,
  timeout: 15000,

  // Output
  verbose: true,
})
```

### Development Config

```ts
// sync.config.ts
import { defineConfig } from 'sync-npm-packages'

export default defineConfig({
  target: 'npmmirror',

  // Quick sync for development
  retry: 2,
  retryDelay: 500,
  concurrency: 15,
  timeout: 5000,

  // Show progress
  verbose: true,
})
```

### JSON Config

```json
// .syncrc.json
{
  "$schema": "https://unpkg.com/sync-npm-packages/schemas/syncrc.json",
  "target": "npmmirror",
  "cwd": "./packages",
  "retry": 5,
  "concurrency": 10,
  "verbose": true
}
```

## Integration Examples

### npm Scripts

```json
{
  "scripts": {
    "release": "bumpp && npm publish && sync-npm-packages --target npmmirror",
    "release:fast": "bumpp && npm publish && sync-npm-packages --target npmmirror --retry 1 --concurrency 20",
    "sync": "sync-npm-packages --target npmmirror --verbose",
    "sync:check": "sync-npm-packages --target npmmirror --dry"
  }
}
```

### GitHub Actions

#### Basic Setup

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org/

      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - run: npx sync-npm-packages --target npmmirror --silent
```

#### Advanced Setup with Retries

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org/

      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      # Sync with enhanced reliability
      - name: Sync to npmmirror
        run: |
          npx sync-npm-packages --target npmmirror \
            --retry 10 \
            --retry-delay 3000 \
            --concurrency 5 \
            --timeout 30000 \
            --verbose
```

#### Monorepo Setup

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org/

      - name: Publish packages
        run: pnpm -r publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Sync to npmmirror
        run: |
          npx sync-npm-packages --target npmmirror \
            --cwd ./packages \
            --retry 5 \
            --concurrency 10 \
            --verbose
```

### Pre-release Script

Create a `scripts/sync-mirror.ts`:

```ts
import { syncNpmPackagesAuto } from 'sync-npm-packages'
import c from 'tinyrainbow'

async function main() {
  console.log(c.cyan('Syncing packages to mirror...'))

  try {
    await syncNpmPackagesAuto({
      target: 'npmmirror',
      cwd: './packages',
      retry: 5,
      retryDelay: 2000,
      concurrency: 10,
      verbose: true,
    })

    console.log(c.green('✓ All packages synced successfully!'))
  } catch (error) {
    console.error(c.red('✗ Sync failed:'), error)
    process.exit(1)
  }
}

main()
```

Then use it:

```json
{
  "scripts": {
    "release": "tsx scripts/sync-mirror.ts"
  }
}
```

## Performance Comparison

### Default Settings

```bash
sync-npm-packages --target npmmirror
# ~10 packages: ~2-3 seconds
# ~50 packages: ~10-15 seconds
# ~100 packages: ~20-30 seconds
```

### High Concurrency

```bash
sync-npm-packages --target npmmirror --concurrency 20
# ~10 packages: ~1-2 seconds
# ~50 packages: ~5-8 seconds
# ~100 packages: ~10-15 seconds
```

### Conservative (Reliable)

```bash
sync-npm-packages --target npmmirror --concurrency 3 --retry 10
# ~10 packages: ~5-8 seconds
# ~50 packages: ~25-40 seconds
# ~100 packages: ~50-80 seconds
# But: Very reliable, good for unstable networks
```

## Troubleshooting Examples

### Check What Would Be Synced

```bash
sync-npm-packages --target npmmirror --dry --verbose
```

### Debug Sync Issues

```bash
sync-npm-packages --target npmmirror --debug --verbose
```

### Retry Failed Packages

If some packages fail, you can:

1. Check the error output for failed packages
2. Sync them individually:

```bash
sync-npm-packages --target npmmirror --include "failed-package-1" --include "failed-package-2" --verbose
```

### Handle Rate Limiting

If you hit rate limits:

```bash
# Lower concurrency, increase delays
sync-npm-packages --target npmmirror \
  --concurrency 2 \
  --retry 10 \
  --retry-delay 5000
```

## Best Practices

### 1. Use Config Files for Projects

Instead of long CLI commands, use a config file:

```ts
// sync.config.ts
export default {
  target: 'npmmirror',
  retry: 5,
  concurrency: 10,
  verbose: true,
}
```

Then simply run:

```bash
sync-npm-packages
```

### 2. CI/CD Optimization

```ts
// In CI, use silent mode but enable retries
export default {
  target: 'npmmirror',
  retry: 10,
  concurrency: 5,
  silent: true,
}
```

### 3. Local Development

```ts
// For local testing, use verbose
export default {
  target: 'npmmirror',
  retry: 2,
  concurrency: 15,
  verbose: true,
}
```

### 4. Monorepo Setup

```ts
export default {
  target: 'npmmirror',
  cwd: './packages',
  ignore: ['**/private/**'],
  exclude: ['@company/internal'],
  retry: 5,
  concurrency: 10,
}
```
