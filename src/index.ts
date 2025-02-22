import { readFile } from 'node:fs/promises'
import { request } from 'node:https'
import process from 'node:process'
import { glob } from 'tinyglobby'
import { assertSyncTarget, isValidPublicPackage, toArray } from './utils'
import type { DetectOptions, PackageJson, SyncOptions } from './types'

/**
 * node_modules must be ignored
 */
const IGNORE_NODE_MODULES = '**/node_modules/**'

/**
 * default patterns to be ignored
 */
const DEFAULT_IGNORE = [
  IGNORE_NODE_MODULES,
  '**/.git/**',
  '**/docs/**',
  '**/tests/**',
  '**/examples/**',
  '**/fixtures/**',
  '**/playground/**',
]

/**
 * glob pattern to match package.json files
 */
const GLOB_PACKAGE_JSON = '**/package.json'

/**
 * Sync package to npm mirror
 * @param packageName - package name
 */
async function syncPackage2NpmMirror(packageName: string) {
  const p = new Promise<void>(resolve => {
    const req = request({
      method: 'PUT',
      path: `/${packageName}/sync_upstream=true`,
      host: 'registry-direct.npmmirror.com',
      protocol: 'https:',
      headers: {
        'content-length': 0,
      },
    })

    req.write('')

    req.on('close', () => {
      resolve()
    })

    req.end()
  })

  return p
}

/**
 * Sync npm packages release to a mirror site
 *
 * @param input - package names
 * @param options - sync options {@link SyncOptions}
 * @returns a Promise with no resolved value
 *
 * @example
 *
 * ```ts
 * import { syncNpmPackages } from 'sync-npm-packages'
 *
 * // single package
 * await syncNpmPackages('package-foobar', { target: 'npmmirror' })
 *
 * // multiple packages
 * await syncNpmPackages(['package-foo', 'package-bar'], { target: 'npmmirror' })
 * ```
 */
export async function syncNpmPackages(
  input: string | string[],
  options: SyncOptions,
): Promise<void[]> {
  const packages = [...new Set(toArray(input))]

  assertSyncTarget(options.target)

  return Promise.all(packages.map(v => syncPackage2NpmMirror(v)))
}

/**
 * Get valid package names from package.json files
 *
 * @param options - detect options {@link DetectOptions}
 * @returns a Promise with valid package names
 */
export async function getValidPackageNames(
  options: DetectOptions = {},
): Promise<string[]> {
  const {
    cwd = process.cwd(),
    defaultIgnore: useDefaultIgnore = true,
    ignore: userIgnore = [],
  } = options
  const ignore = toArray(userIgnore)

  if (useDefaultIgnore) {
    ignore.push(...DEFAULT_IGNORE)
  } else {
    ignore.push(IGNORE_NODE_MODULES)
  }

  const files = await glob(GLOB_PACKAGE_JSON, {
    cwd,
    ignore,
    absolute: true,
    onlyFiles: true,
  })
  const packages: string[] = []

  for await (const file of files) {
    const content = await readFile(file, 'utf-8')
    const packageJson = JSON.parse(content) as PackageJson

    if (isValidPublicPackage(packageJson)) {
      packages.push(packageJson.name)
    }
  }

  return packages
}

/**
 * Auto detect and sync npm packages release to a mirror site
 * @param options - detect options {@link DetectOptions} and sync options {@link SyncOptions }
 *
 * @example
 *
 * ```ts
 * import { syncNpmPackagesAuto } from 'sync-npm-packages'
 *
 * await syncNpmPackagesAuto({ target: 'npmmirror' })
 * ```
 */
export async function syncNpmPackagesAuto(
  options: DetectOptions & SyncOptions,
): Promise<void[]> {
  assertSyncTarget(options.target)

  const packages = await getValidPackageNames(options)
  return syncNpmPackages(packages, options)
}

export * from './types'
export * from './config'
