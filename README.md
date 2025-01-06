# sync-npm-packages

[![CI](https://github.com/ntnyq/sync-npm-packages/workflows/CI/badge.svg)](https://github.com/ntnyq/sync-npm-packages/actions)
[![NPM VERSION](https://img.shields.io/npm/v/sync-npm-packages.svg)](https://www.npmjs.com/package/sync-npm-packages)
[![NPM DOWNLOADS](https://img.shields.io/npm/dy/sync-npm-packages.svg)](https://www.npmjs.com/package/sync-npm-packages)
[![LICENSE](https://img.shields.io/github/license/ntnyq/sync-npm-packages.svg)](https://github.com/ntnyq/sync-npm-packages/blob/main/LICENSE)

Sync released npm packages to a mirror site.

## Without installation

```shell
npx sync-npm-packages --target npmmirror
```

```shell
yarn dlx sync-npm-packages --target npmmirror
```

```shell
pnpm dlx sync-npm-packages --target npmmirror
```

## Install

```shell
npm install sync-npm-packages -D
```

```shell
yarn add sync-npm-packages -D
```

```shell
pnpm add sync-npm-packages -D
```

## Usage

```ts
import { syncNpmPackages, syncNpmPackagesAuto } from 'sync-npm-packages'

// single package
await syncNpmPackages('package-foobar', { target: 'npmmirror' })

// multiple packages
await syncNpmPackages(['package-foo', 'package-bar'], { target: 'npmmirror' })

// auto detect package.json and sync
await syncNpmPackagesAuto({ target: 'npmmirror' })

// auto sync with options
await syncNpmPackagesAuto({
  cwd: './packages',
  ignore: ['**/themes/**', '**/tools/**'],
  target: 'npmmirror',
})
```

## Cli

In package.json, if installed as a devDependency, `npx` can be emited.

```json
{
  "scripts": {
    "release": "npm publish && npx sync-npm-packages --target npmmirror"
  }
}
```

## GitHub Action

Run `npx sync-npm-packages` after publishing packages to npm.

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
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

        # publish packages to npm

      - run: npx sync-npm-packages --target npmmirror
```

## API

### syncNpmPackages

**Type**: `(input: string | string[], options: SyncOptions) => Promise<void[]>`

Sync npm packages release to a mirror site.

#### Parameters

**input**

The package name or package names to sync.

- **Type**: `string | string[]`

**options**

Sync options.

- **Type**: `SyncOptions`

### syncNpmPackagesAuto

**Type**: `(options?: SyncOptions & DetectOptions) => Promise<void[]>`

Auto detect and sync npm packages release to a mirror site.

#### Parameters

**options**

The sync options.

- **Type**: `SyncOptions & DetectOptions`

## Interfaces

```ts
export interface DetectOptions {
  /**
   * Current working directory for glob
   *
   * @default process.cwd()
   */
  cwd?: string

  /**
   * Ignore package.json glob pattern
   *
   * @default []
   */
  ignore?: string | string[]
}

export interface SyncOptions {
  /**
   * Sync target mirror set
   *
   * @requires
   */
  target: 'npmmirror'

  /**
   * Enable debug mode
   *
   * @default false
   */
  debug?: boolean
}
```

## Credits

- Idea from [vuepress/ecosystem](https://github.com/vuepress/ecosystem/blob/main/scripts/syncNpmmirror.ts)

## License

[MIT](./LICENSE) License © 2025-PRESENT [ntnyq](https://github.com/ntnyq)