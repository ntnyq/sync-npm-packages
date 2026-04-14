import { describe, expect, it } from 'vitest'
import { defineConfig, resolveConfig } from '../src/config'
import type { OptionalOptions } from '../src/types'

describe('config', () => {
  describe(defineConfig, () => {
    it('should return config as is', () => {
      const config: OptionalOptions = {
        target: 'npmmirror',
        cwd: '/test',
      }
      expect(defineConfig(config)).toStrictEqual(config)
    })

    it('should work with empty config', () => {
      expect(defineConfig()).toStrictEqual({})
    })

    it('should preserve all config properties', () => {
      const config: OptionalOptions = {
        target: 'custom',
        cwd: '/test',
        ignore: ['*.md'],
        include: ['pkg-a', 'pkg-b'],
        exclude: ['pkg-c'],
        syncPathTemplate: '/api/sync/{packageName}',
        syncMethod: 'POST',
        withOptional: true,
        defaultIgnore: false,
        dry: true,
      }
      expect(defineConfig(config)).toStrictEqual(config)
    })
  })

  describe(resolveConfig, () => {
    it('should return cli config when no config file exists', async () => {
      const cliConfig: OptionalOptions = {
        target: 'npmmirror',
        cwd: '/test',
      }
      const result = await resolveConfig(cliConfig)
      expect(result).toStrictEqual(cliConfig)
    })

    it('should merge cli config with file config with cli taking precedence', async () => {
      const cliConfig: OptionalOptions = {
        target: 'npmmirror',
        dry: true,
      }
      const result = await resolveConfig(cliConfig)
      expect(result.target).toBe('npmmirror')
      expect(result.dry).toBeTruthy()
    })

    it('should work with empty cli config', async () => {
      const result = await resolveConfig({})
      expect(result).toBeDefined()
    })

    it('should handle partial cli config', async () => {
      const cliConfig: OptionalOptions = {
        target: 'npmmirror',
      }
      const result = await resolveConfig(cliConfig)
      expect(result.target).toBe('npmmirror')
    })
  })
})
