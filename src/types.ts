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
   * Enable debug mode
   *
   * @default false
   */
  debug?: boolean
}

/**
 * options
 */
export type Options = DetectOptions
  & SyncOptions & {
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
