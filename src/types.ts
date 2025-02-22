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
   * Ignore package.json glob pattern
   *
   * @default []
   */
  ignore?: string | string[]
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
  private?: boolean
}
