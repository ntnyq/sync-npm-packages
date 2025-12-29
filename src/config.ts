import process from 'node:process'
import { createConfigLoader } from 'unconfig'
import type { OptionalOptions } from './types'

/**
 * Define config for cli and NodeJS api
 *
 * @param config - user defined config
 * @returns config
 */
export function defineConfig(config: OptionalOptions = {}): OptionalOptions {
  return config
}

/**
 * Resolve user definedConfig based on cli config and config file
 *
 * @param cliConfig - cli config
 * @returns merged config
 */
export async function resolveConfig<T extends OptionalOptions = {}>(
  cliConfig: Partial<T> = {},
): Promise<Partial<T>> {
  const loader = createConfigLoader<T>({
    sources: [
      {
        files: ['sync.config'],
        extensions: ['mts', 'cts', 'ts', 'mjs', 'cjs', 'js', 'json'],
      },
      {
        files: ['.syncrc'],
        extensions: ['json'],
      },
    ],
    cwd: process.cwd(),
    merge: false,
  })
  const { config = {} } = await loader.load()

  // CLI config takes precedence over file config
  const mergedConfig: Partial<T> = {
    ...config,
    ...cliConfig,
  }

  return mergedConfig
}
