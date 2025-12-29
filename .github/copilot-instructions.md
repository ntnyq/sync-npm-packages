# Copilot Instructions for sync-npm-packages

## Project Overview

This is a CLI tool and library for syncing published npm packages to mirror sites (currently supports npmmirror). The tool scans workspace package.json files, identifies valid public packages, and triggers sync requests to the configured mirror registry.

## Architecture

### Core Components

- **`bin.mjs`**: ESM entry point that imports the compiled CLI
- **`src/cli.ts`**: CLI implementation using `cac`, handles command parsing and execution flow
- **`src/core.ts`**: Core business logic for package detection and syncing
  - `syncNpmPackages()`: Sends HTTP PUT requests to mirror APIs
  - `getValidPackageNames()`: Scans workspace with glob patterns to find package.json files
  - `syncNpmPackagesAuto()`: Convenience method combining detection + syncing
- **`src/config.ts`**: Config resolution using `unconfig` (supports 8+ config file formats)
- **`src/types.ts`**: TypeScript interfaces for options and package.json structure
- **`src/utils.ts`**: Validation helpers for package visibility and target assertions

### Key Data Flows

1. **CLI execution**: `bin.mjs` → compiled `dist/cli.mjs` → config resolution → package detection → sync requests
2. **Package detection**: Glob `**/package.json` → parse JSON → validate (public + has name/version) → deduplicate
3. **Sync request**: HTTPS PUT to `registry-direct.npmmirror.com/${packageName}/sync_upstream=true`

## Development Workflow

### Build & Development

```bash
pnpm build              # Build with tsdown (produces dist/index.mjs and dist/cli.mjs)
pnpm dev                # Watch mode rebuild
pnpm typecheck          # Run TypeScript compiler checks
pnpm lint               # ESLint with @ntnyq/eslint-config
```

### Build Configuration

- **`tsdown.config.ts`**: Dual-entry build (library + CLI), bundles `@ntnyq/utils`, generates `.d.mts` types
- Uses **isolated declarations** mode - all exports must have explicit types
- ESM-only project (`"type": "module"`)

### Release Process

```bash
pnpm release            # Runs lint → typecheck → bumpp → self-sync to npmmirror
```

The project dogfoods itself by running `sync-npm-packages --target npmmirror` after version bumps.

## Code Conventions

### TypeScript Patterns

- **Explicit type exports**: Types are exported separately from implementation (`export * from './types'`)
- **Options pattern**: `Options = DetectOptions & SyncOptions & { dry?: boolean }`
- **Array normalization**: Use `toArray()` from `@ntnyq/utils` for string|string[] inputs
- **Validation before processing**: Always call `assertSyncTarget()` before sync operations

### File Organization

- All source in `src/`, compiled to `dist/`
- JSON schemas in `schemas/` for config file IntelliSense
- Entry points: library (`src/index.ts`), CLI (`src/cli.ts`)

### Error Handling

- CLI catches errors, logs with `tinyrainbow` colors, prints stack traces, exits with code 1
- Core functions throw errors for invalid configs (use `assertSyncTarget()`)

### Glob Patterns

- **Default ignores**: `node_modules`, `.git`, `docs`, `tests`, `examples`, `fixtures`, `playground`
- **User control**: `defaultIgnore: false` disables all defaults except `node_modules` (always ignored)
- Uses `tinyglobby` with `absolute: true` for consistent path handling

## Configuration System

The tool uses `unconfig` with this resolution order:

1. `sync.config.{mts,cts,ts,mjs,cjs,js,json}`
2. `.syncrc.json` (with JSON schema at `schemas/syncrc.json`)

**Priority**: CLI flags override config file values (merged in `resolveConfig()`)

**Type helper**: Export `defineConfig()` for type-safe config authoring

## Testing & Quality

- **Linting**: `@ntnyq/eslint-config` (flat config format)
- **Formatting**: Prettier via `@ntnyq/prettier-config`
- **Pre-commit**: `nano-staged` with `husky` auto-fixes staged files
- **Node version**: Requires >=18.18.0 (check `engines` in package.json)

## Integration Points

### External Dependencies

- **cac**: CLI framework (zero-config option parsing)
- **tinyglobby**: Fast glob implementation
- **tinyrainbow**: Minimal chalk alternative
- **unconfig**: Universal config loader
- **@ntnyq/utils**: Utility functions (`toArray`, `unique`)

### API Surface

**Library exports** (`src/index.ts`):

- `syncNpmPackages(packages, options)` - Direct sync API
- `syncNpmPackagesAuto(options)` - Auto-detect + sync
- `defineConfig(config)` - Config type helper
- All types from `types.ts`

**CLI bin**: `sync-npm-packages` command via `bin.mjs`

## Mirror Registry Protocol

Currently only supports **npmmirror**. To add new targets:

1. Add target to `SUPPORTED_TARGETS` in `src/utils.ts`
2. Implement sync function in `src/core.ts` (follow `syncPackage2NpmMirror` pattern)
3. Update `target` type in `src/types.ts` and `schemas/syncrc.json`

The npmmirror sync uses a simple HTTPS PUT request with no authentication.
