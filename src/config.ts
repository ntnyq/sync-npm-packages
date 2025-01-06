import process from 'node:process'
import { createConfigLoader } from 'unconfig'
import type { OptionalOptions } from './types'

/**
 * Define config for cli and NodeJS api
 *
 * @param config - user defined config
 * @returns config
 */
export function defineConfig(config: OptionalOptions = {}) {
  return config
}

/**
 * Resolve user definedConfig based on cli config and config file
 *
 * @param cliConfig - cli config
 * @returns merged config
 */
export async function resolveConfig<T extends OptionalOptions = {}>(cliConfig: Partial<T> = {}) {
  const loader = createConfigLoader<T>({
    sources: [
      {
        files: ['sync.config'],
        extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs'],
      },
      {
        files: ['.syncrc'],
        extensions: ['json', ''],
      },
      {
        files: 'package.json',
        rewrite(config) {
          return (config as { sync?: any })?.sync
        },
      },
    ],
    cwd: process.cwd(),
    merge: false,
  })
  const { config = {}, sources = [] } = await loader.load()

  return (
    sources.length
      ? {
          ...config,
          ...cliConfig,
        }
      : cliConfig
  ) as Partial<T>
}
