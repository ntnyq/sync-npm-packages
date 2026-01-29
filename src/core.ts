import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { request } from 'node:https'
import { join } from 'node:path'
import process from 'node:process'
import { toArray, unique } from '@ntnyq/utils'
import { glob } from 'tinyglobby'
import c from 'tinyrainbow'
import { assertSyncTarget, isValidPublicPackage } from './utils'
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
 * Request timeout in milliseconds
 */
const DEFAULT_REQUEST_TIMEOUT = 10000

/**
 * Default retry count
 */
const DEFAULT_RETRY = 3

/**
 * Default retry delay in milliseconds
 */
const DEFAULT_RETRY_DELAY = 1000

/**
 * Default concurrency limit
 */
const DEFAULT_CONCURRENCY = 5

/**
 * Delay for a specified amount of time
 * @param ms - milliseconds to delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Sync package to npm mirror
 * @param packageName - package name
 * @param options - sync options
 */
async function syncPackage2NpmMirror(
  packageName: string,
  options: SyncOptions,
): Promise<void> {
  const timeout = options.timeout ?? DEFAULT_REQUEST_TIMEOUT
  const registry = options.registry ?? 'registry-direct.npmmirror.com'
  const registryHost = new URL(`https://${registry}`).hostname

  return new Promise<void>((resolve, reject) => {
    const req = request(
      {
        method: 'PUT',
        path: `/${packageName}/sync_upstream=true`,
        host: registryHost,
        protocol: 'https:',
        headers: {
          'content-length': 0,
        },
        timeout,
      },
      res => {
        let responseBody = ''

        res.on('data', chunk => {
          responseBody += chunk
        })

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve()
          } else {
            const errorMsg = responseBody
              ? `HTTP ${res.statusCode}: ${responseBody}`
              : `HTTP ${res.statusCode}`
            reject(new Error(`Failed to sync ${packageName}: ${errorMsg}`))
          }
        })
      },
    )

    req.on('error', err => {
      reject(new Error(`Failed to sync ${packageName}: ${err.message}`))
    })

    req.on('timeout', () => {
      req.destroy()
      reject(
        new Error(
          `Failed to sync ${packageName}: Request timeout after ${timeout}ms`,
        ),
      )
    })

    req.end()
  })
}

/**
 * Load cached package names
 * @param cacheDir - cache directory
 */
async function loadSyncCache(cacheDir: string): Promise<Set<string>> {
  try {
    const cachePath = join(cacheDir, 'synced-packages.json')
    const content = await readFile(cachePath, 'utf-8')
    const data = JSON.parse(content) as { packages: string[] }
    return new Set(data.packages)
  } catch {
    return new Set()
  }
}

/**
 * Save cached package names
 * @param cacheDir - cache directory
 * @param packages - package names to cache
 */
async function saveSyncCache(
  cacheDir: string,
  packages: Set<string>,
): Promise<void> {
  try {
    await mkdir(cacheDir, { recursive: true })
    const cachePath = join(cacheDir, 'synced-packages.json')
    const data = {
      packages: Array.from(packages),
      timestamp: new Date().toISOString(),
    }
    await writeFile(cachePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    // Silently ignore cache write errors
    if (err instanceof Error) {
      console.warn(
        c.yellow(`Warning: Failed to save sync cache: ${err.message}`),
      )
    }
  }
}

/**
 * Sync package with retry mechanism
 * @param packageName - package name
 * @param options - sync options
 */
async function syncPackageWithRetry(
  packageName: string,
  options: SyncOptions,
): Promise<void> {
  const maxRetries = options.retry ?? DEFAULT_RETRY
  const retryDelay = options.retryDelay ?? DEFAULT_RETRY_DELAY
  const { verbose, silent, debug, beforeSync, afterSync } = options

  try {
    // Call beforeSync hook
    if (beforeSync) {
      await beforeSync(packageName)
    }
  } catch (err) {
    if (afterSync) {
      await afterSync(
        packageName,
        err instanceof Error ? err : new Error(String(err)),
      )
    }
    throw err
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (debug && !silent) {
        console.log(
          c.dim(
            `  Attempting ${packageName} (${attempt + 1}/${maxRetries + 1})...`,
          ),
        )
      }

      await syncPackage2NpmMirror(packageName, options)

      if (verbose && !silent) {
        console.log(c.green(`  ✓ ${packageName}`))
      }

      // Call afterSync hook on success
      if (afterSync) {
        await afterSync(packageName)
      }

      return
    } catch (err) {
      const isLastAttempt = attempt === maxRetries

      if (debug && !silent) {
        console.log(
          c.yellow(
            `  Attempt ${attempt + 1} failed for ${packageName}: ${err instanceof Error ? err.message : String(err)}`,
          ),
        )
      }

      if (isLastAttempt) {
        if (verbose && !silent) {
          console.log(
            c.red(
              `  ✗ ${packageName}: ${err instanceof Error ? err.message : String(err)}`,
            ),
          )
        }

        // Call afterSync hook on final failure
        if (afterSync) {
          await afterSync(
            packageName,
            err instanceof Error ? err : new Error(String(err)),
          )
        }

        throw err
      }

      // Exponential backoff
      const waitTime = retryDelay * Math.pow(2, attempt)
      if (debug && !silent) {
        console.log(c.dim(`  Waiting ${waitTime}ms before retry...`))
      }
      await delay(waitTime)
    }
  }
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
  let packages = unique(toArray(input))
  const {
    silent,
    verbose,
    concurrency = DEFAULT_CONCURRENCY,
    cache,
    cacheDir = '.sync-cache',
  } = options

  assertSyncTarget(options.target)

  // Load cache if enabled
  let syncedPackages = new Set<string>()
  if (cache) {
    syncedPackages = await loadSyncCache(cacheDir)
    packages = packages.filter(pkg => !syncedPackages.has(pkg))

    if (!silent && verbose && syncedPackages.size > 0) {
      console.log(
        c.dim(`\nSkipping ${syncedPackages.size} already synced package(s)\n`),
      )
    }
  }

  if (packages.length === 0) {
    if (!silent && verbose && cache) {
      console.log(c.green('All packages have been synced already!'))
    }
    return []
  }

  if (!silent && verbose) {
    console.log(
      c.dim(
        `\nSyncing ${packages.length} package(s) with concurrency ${concurrency}...\n`,
      ),
    )
  }

  const results: void[] = []
  const errors: { package: string; error: Error }[] = []
  const executing: Promise<void>[] = []
  let completed = 0

  for (const pkg of packages) {
    const promise = syncPackageWithRetry(pkg, options)
      .then(() => {
        completed++
        // Add to cache on success
        if (cache) {
          syncedPackages.add(pkg)
        }
        if (!silent && !verbose) {
          // Show progress in non-verbose mode
          process.stdout.write(
            `\r${c.dim(`Progress: ${completed}/${packages.length}`)} ${c.green('✓'.repeat(Math.floor((completed / packages.length) * 20)))}`,
          )
        }
      })
      .catch(err => {
        completed++
        errors.push({ package: pkg, error: err as Error })
        if (!silent && !verbose) {
          process.stdout.write(
            `\r${c.dim(`Progress: ${completed}/${packages.length}`)} ${c.green('✓'.repeat(Math.floor((completed / packages.length) * 20)))}`,
          )
        }
      })
      .finally(() => {
        executing.splice(executing.indexOf(promise), 1)
      })

    executing.push(promise)
    results.push(promise as any)

    if (executing.length >= concurrency) {
      await Promise.race(executing)
    }
  }

  await Promise.all(executing)

  // Save cache if enabled
  if (cache && syncedPackages.size > 0) {
    await saveSyncCache(cacheDir, syncedPackages)
  }

  // Clear progress line
  if (!silent && !verbose && packages.length > 0) {
    process.stdout.write('\n')
  }

  // Report errors
  if (errors.length > 0 && !silent) {
    console.log(c.red(`\n${errors.length} package(s) failed to sync:`))
    for (const { package: pkg, error } of errors) {
      console.log(c.red(`  - ${pkg}: ${error.message}`))
    }
    throw new Error(`Failed to sync ${errors.length} package(s)`)
  }

  return results
}

/**
 * Get valid package names from all package.json files
 *
 * @param options - detect options {@link DetectOptions}
 * @returns a promise resolves valid package names
 */
export async function getValidPackageNames(
  options: DetectOptions = {},
): Promise<string[]> {
  const {
    cwd = process.cwd(),
    defaultIgnore: useDefaultIgnore = true,
    ignore: userIgnore = [],
    include = [],
    exclude = [],
    withOptional = false,
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
  const packages: string[] = [...toArray(include)]

  const fileContents = await Promise.all(
    files.map(async file => {
      try {
        const content = await readFile(file, 'utf-8')
        return JSON.parse(content) as PackageJson
      } catch (err) {
        // Ignore invalid JSON files
        if (err instanceof Error) {
          console.warn(
            c.yellow(`Warning: Failed to parse ${file}: ${err.message}`),
          )
        }
        return null
      }
    }),
  )

  // Use Set for better performance on exclude check
  const excludeSet = new Set(toArray(exclude))

  for (const packageJson of fileContents) {
    if (!packageJson) {
      continue
    }

    if (isValidPublicPackage(packageJson)) {
      packages.push(packageJson.name)

      if (withOptional) {
        packages.push(...Object.keys(packageJson.optionalDependencies || {}))
      }
    }
  }

  return unique(packages.filter(pkg => !excludeSet.has(pkg)))
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
