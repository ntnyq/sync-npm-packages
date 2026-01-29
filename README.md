# sync-npm-packages

[![CI](https://github.com/ntnyq/sync-npm-packages/workflows/CI/badge.svg)](https://github.com/ntnyq/sync-npm-packages/actions)
[![NPM VERSION](https://img.shields.io/npm/v/sync-npm-packages.svg)](https://www.npmjs.com/package/sync-npm-packages)
[![NPM DOWNLOADS](https://img.shields.io/npm/dy/sync-npm-packages.svg)](https://www.npmjs.com/package/sync-npm-packages)
[![LICENSE](https://img.shields.io/github/license/ntnyq/sync-npm-packages.svg)](https://github.com/ntnyq/sync-npm-packages/blob/main/LICENSE)

Sync released npm packages to mirror registries automatically. e.g: [npmmirror](https://npmmirror.com/)

## Features

- 🚀 **Zero Config** - Works out of the box with sensible defaults
- 📦 **Auto Detection** - Automatically discovers packages in monorepos
- 🔧 **Flexible Config** - Supports 8+ config file formats via `unconfig`
- 🎯 **CLI & API** - Use as a CLI tool or Node.js library
- 🔄 **Retry Mechanism** - Automatic retry with exponential backoff
- ⚡ **Concurrency Control** - Prevent rate limiting with configurable limits
- 📊 **Progress Display** - Real-time sync progress with detailed logging
- 🪝 **Hooks** - `beforeSync` and `afterSync` callbacks for custom logic
- 💾 **Smart Caching** - Cache synced packages to avoid redundant operations
- 🔐 **Custom Mirrors** - Support for custom registry URLs
- 🔄 **GitHub Actions** - Easy integration with CI/CD workflows
- 🌐 **Mirror Support** - Currently supports [npmmirror](https://npmmirror.com/)

## Quick Start

Run without installation:

```bash
# npm
npx sync-npm-packages --target npmmirror
```

```bash
# yarn
yarn dlx sync-npm-packages --target npmmirror
```

```bash
# pnpm
pnpm dlx sync-npm-packages --target npmmirror
```

## Installation

```bash
npm install sync-npm-packages -D
```

```bash
yarn add sync-npm-packages -D
```

```bash
pnpm add sync-npm-packages -D
```

## Usage

Check [docs - examples](./docs/EXAMPLES.md) for more examples.

### As a Library

```ts
import { syncNpmPackages, syncNpmPackagesAuto } from 'sync-npm-packages'

// Sync a single package
await syncNpmPackages('package-foobar', { target: 'npmmirror' })

// Sync multiple packages
await syncNpmPackages(['package-foo', 'package-bar'], { target: 'npmmirror' })

// Auto-detect and sync all packages in workspace
await syncNpmPackagesAuto({ target: 'npmmirror' })

// Auto-sync with custom options
await syncNpmPackagesAuto({
  cwd: './packages',
  ignore: ['**/themes/**', '**/tools/**'],
  target: 'npmmirror',
})

// With retry and concurrency control
await syncNpmPackagesAuto({
  target: 'npmmirror',
  retry: 5,
  retryDelay: 2000,
  concurrency: 10,
  timeout: 15000,
  verbose: true,
})
```

### As a CLI

```bash
# Sync all detected packages
sync-npm-packages --target npmmirror

# Specify working directory
sync-npm-packages --target npmmirror --cwd ./packages

# With custom ignore patterns
sync-npm-packages --target npmmirror --ignore "**/private/**"

# Disable default ignore patterns
sync-npm-packages --target npmmirror --no-default-ignore

# Enable verbose output
sync-npm-packages --target npmmirror --verbose

# With retry and concurrency control
sync-npm-packages --target npmmirror --retry 5 --concurrency 10

# Custom timeout
sync-npm-packages --target npmmirror --timeout 15000

# Enable debug mode
sync-npm-packages --target npmmirror --debug
```

#### CLI Options

| Option                | Type      | Default | Description                       |
| --------------------- | --------- | ------- | --------------------------------- |
| `--target`            | `string`  | -       | Target mirror registry (required) |
| `--cwd`               | `string`  | -       | Working directory                 |
| `--ignore`            | `string`  | -       | Ignore glob pattern               |
| `--include`           | `string`  | -       | Additional packages to sync       |
| `--exclude`           | `string`  | -       | Exclude packages from sync        |
| `--with-optional`     | `boolean` | `false` | Include optionalDependencies      |
| `--no-default-ignore` | `boolean` | -       | Disable default ignore patterns   |
| `--retry`             | `number`  | `3`     | Number of retry attempts          |
| `--retry-delay`       | `number`  | `1000`  | Delay between retries (ms)        |
| `--concurrency`       | `number`  | `5`     | Max concurrent requests           |
| `--timeout`           | `number`  | `10000` | Request timeout (ms)              |
| `--verbose`           | `boolean` | `false` | Enable detailed output            |
| `--silent`            | `boolean` | `false` | Suppress all output               |
| `--debug`             | `boolean` | `false` | Enable debug mode                 |
| `--dry`               | `boolean` | `false` | Dry run without actual sync       |
| `--version`           | -         | -       | Show version                      |
| `--help`              | -         | -       | Show help                         |

### In npm Scripts

Add to your [package.json](package.json):

```json
{
  "scripts": {
    "release": "bumpp && npm publish && sync-npm-packages --target npmmirror"
  }
}
```

## Configuration

### Config File Resolution

`sync-npm-packages` uses [unconfig](https://github.com/antfu-collective/unconfig) for config loading. It searches for config files in the following order:

- `sync.config.{mts,cts,ts,mjs,cjs,js,json}`
- `.syncrc.json`

### TypeScript Config

Use the `defineConfig` helper for type safety:

```ts
// sync.config.ts
import { defineConfig } from 'sync-npm-packages'

export default defineConfig({
  target: 'npmmirror',
  cwd: './packages',
  ignore: ['**/private/**'],
  defaultIgnore: true,

  // Performance options
  retry: 5,
  retryDelay: 2000,
  concurrency: 10,
  timeout: 15000,

  // Output options
  verbose: true,
})
```

### JSON Config

JSON configs support IntelliSense via JSON schema:

```json
// .syncrc.json
{
  "$schema": "https://unpkg.com/sync-npm-packages/schemas/syncrc.json",
  "target": "npmmirror",
  "defaultIgnore": false
}
```

### Priority

> [!NOTE]
> CLI options override config file settings.

## GitHub Actions Integration

Automatically sync packages after publishing to npm:

```yaml
name: Release

permissions:
  contents: write

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v6
        with:
          node-version: lts/*
          registry-url: https://registry.npmjs.org/

      # Build and publish your packages
      - run: npm publish

      # Sync to mirror
      - run: npx sync-npm-packages --target npmmirror
```

## API Reference

### `syncNpmPackages(input, options)`

Sync specified packages to a mirror registry.

```ts
function syncNpmPackages(
  input: string | string[],
  options: SyncOptions,
): Promise<void[]>
```

#### Parameters

- **`input`** (`string | string[]`) - Package name(s) to sync
- **`options`** (`SyncOptions`) - Sync configuration
  - `target` (`'npmmirror'`) - Target mirror registry (required)
  - `debug` (`boolean`) - Enable debug logging (default: `false`)

#### Example

```ts
import { syncNpmPackages } from 'sync-npm-packages'

// Single package
await syncNpmPackages('my-package', { target: 'npmmirror' })

// Multiple packages
await syncNpmPackages(['pkg-a', 'pkg-b'], { target: 'npmmirror' })
```

---

### `syncNpmPackagesAuto(options)`

Auto-detect and sync packages from workspace.

```ts
function syncNpmPackagesAuto(
  options?: SyncOptions & DetectOptions,
): Promise<void[]>
```

#### Parameters

- **`options`** (`SyncOptions & DetectOptions`) - Combined sync and detection options
  - All `SyncOptions` properties
  - All `DetectOptions` properties (see below)

#### Example

```ts
import { syncNpmPackagesAuto } from 'sync-npm-packages'

await syncNpmPackagesAuto({
  target: 'npmmirror',
  cwd: './packages',
  ignore: ['**/test/**'],
  exclude: ['private-pkg'],
})
```

---

## Type Definitions

### `DetectOptions`

Options for package detection in workspace.

| Property        | Type                 | Default         | Description                        |
| --------------- | -------------------- | --------------- | ---------------------------------- |
| `cwd`           | `string`             | `process.cwd()` | Working directory for glob search  |
| `defaultIgnore` | `boolean`            | `true`          | Use built-in ignore patterns       |
| `exclude`       | `string \| string[]` | `[]`            | Package names to exclude from sync |
| `ignore`        | `string \| string[]` | `[]`            | Glob patterns to ignore            |
| `include`       | `string \| string[]` | `[]`            | Additional packages to sync        |
| `withOptional`  | `boolean`            | `false`         | Include `optionalDependencies`     |

### `SyncOptions`

Options for syncing packages to mirrors.

| Property      | Type                                                     | Default       | Description                           |
| ------------- | -------------------------------------------------------- | ------------- | ------------------------------------- |
| `target`      | `'npmmirror'`                                            | -             | Target mirror registry (required)     |
| `debug`       | `boolean`                                                | `false`       | Enable debug logging                  |
| `retry`       | `number`                                                 | `3`           | Number of retry attempts on failure   |
| `retryDelay`  | `number`                                                 | `1000`        | Delay between retries in milliseconds |
| `concurrency` | `number`                                                 | `5`           | Maximum number of concurrent requests |
| `timeout`     | `number`                                                 | `10000`       | Request timeout in milliseconds       |
| `verbose`     | `boolean`                                                | `false`       | Enable verbose output with progress   |
| `silent`      | `boolean`                                                | `false`       | Silent mode, suppress all output      |
| `registry`    | `string`                                                 | -             | Custom registry URL (optional)        |
| `cache`       | `boolean`                                                | `false`       | Enable caching of synced packages     |
| `cacheDir`    | `string`                                                 | `.sync-cache` | Cache directory path                  |
| `beforeSync`  | `(name: string) => void \| Promise<void>`                | -             | Hook before each sync                 |
| `afterSync`   | `(name: string, error?: Error) => void \| Promise<void>` | -             | Hook after each sync                  |

### Advanced Features

For detailed information about advanced features, see [ADVANCED.md](ADVANCED.md):

- **Hooks** (`beforeSync`, `afterSync`) - Execute custom logic before/after sync
- **Caching** - Automatically skip already synced packages
- **Custom Registries** - Sync to non-default mirror endpoints

### Default Ignore Patterns

When `defaultIgnore: true` (default), these patterns are automatically excluded:

- `**/node_modules/**`
- `**/.git/**`
- `**/docs/**`
- `**/tests/**`
- `**/examples/**`
- `**/fixtures/**`
- `**/playground/**`

> [!TIP]
> Use `--no-default-ignore` or `defaultIgnore: false` to disable all defaults except `**/node_modules/**`.

---

## Requirements

- Node.js >= 20.19.0

## Related Projects

- [vuepress/ecosystem](https://github.com/vuepress/ecosystem/blob/main/scripts/syncNpmmirror.ts) - Original inspiration
- [npmmirror](https://npmmirror.com/) - The npm mirror service

## License

[MIT](./LICENSE) License © 2025-PRESENT [ntnyq](https://github.com/ntnyq)
