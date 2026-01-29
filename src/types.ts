export interface DetectOptions {
  /**
   * Current working directory for glob
   *
   * @default process.cwd()
   */
  cwd?: string

  /**
   * Use built-in default ignore patterns
   *
   * @default true
   */
  defaultIgnore?: boolean

  /**
   * Exclude packages from being synced
   *
   * @default []
   */
  exclude?: string | string[]

  /**
   * Ignore package.json glob pattern
   *
   * @default []
   */
  ignore?: string | string[]

  /**
   * Additional packages to sync
   *
   * @default []
   */
  include?: string | string[]

  /**
   * With `optionalDependencies` in `package.json`
   *
   * @default false
   */
  withOptional?: boolean
}

export interface SyncOptions {
  /**
   * Target mirror site to sync
   *
   * @requires
   */
  target: 'npmmirror'

  /**
   * Enable caching of synced packages to avoid duplicate syncs
   *
   * @default false
   */
  cache?: boolean

  /**
   * Directory to store cache files
   * Only used when cache is enabled
   *
   * @default '.sync-cache'
   */
  cacheDir?: string

  /**
   * Maximum number of concurrent sync requests
   *
   * @default 5
   */
  concurrency?: number

  /**
   * Enable debug mode
   *
   * @default false
   */
  debug?: boolean

  /**
   * Custom registry URL for syncing
   * When specified, overrides the default npmmirror registry
   *
   * @example 'https://registry.example.com'
   */
  registry?: string

  /**
   * Number of retry attempts on failure
   *
   * @default 3
   */
  retry?: number

  /**
   * Delay between retries in milliseconds
   *
   * @default 1000
   */
  retryDelay?: number

  /**
   * Silent mode, suppress all output
   *
   * @default false
   */
  silent?: boolean

  /**
   * Request timeout in milliseconds
   *
   * @default 10000
   */
  timeout?: number

  /**
   * Enable verbose output
   *
   * @default false
   */
  verbose?: boolean

  /**
   * Callback function executed after each package sync attempt
   * Can be used for logging, metrics collection, or cleanup
   *
   * @param packageName - Name of the package that was synced
   * @param error - Error if sync failed, undefined if successful
   * @returns Promise that resolves after completion
   *
   * @example
   * afterSync: async (pkg, error) => {
   *   if (error) {
   *     console.log(`Failed to sync ${pkg}: ${error.message}`)
   *   } else {
   *     console.log(`Successfully synced ${pkg}`)
   *   }
   * }
   */
  afterSync?: (packageName: string, error?: Error) => Promise<void> | void

  /**
   * Callback function executed before each package sync
   * Can be used for logging, validation, or custom logic
   *
   * @param packageName - Name of the package being synced
   * @returns Promise that resolves before sync proceeds, or rejects to skip sync
   *
   * @example
   * beforeSync: async (pkg) => {
   *   console.log(`About to sync ${pkg}`)
   * }
   */
  beforeSync?: (packageName: string) => Promise<void> | void
}

/**
 * options
 */
export type Options = DetectOptions &
  SyncOptions & {
    /**
     * Dry run
     *
     * @default false
     */
    dry?: boolean
  }

/**
 * All property is optional
 */
export type OptionalOptions = Partial<Options>

/**
 * partial of package.json type
 */
export interface PackageJson {
  name: string
  version: string
  optionalDependencies?: Record<string, string>
  private?: boolean
}
