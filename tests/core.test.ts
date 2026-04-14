import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getValidPackageNames, syncNpmPackages } from '../src/core'
import {
  buildCustomSyncRequestPath,
  buildSyncRequestPath,
  normalizeRegistryHost,
  resolveSyncRequest,
} from '../src/transport'
import type { PackageJson } from '../src/types'

describe('core', () => {
  const testDir = join(process.cwd(), 'tests', 'fixtures', 'test-workspace')

  beforeEach(async () => {
    // Create test directory structure
    await mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true })
  })

  describe(getValidPackageNames, () => {
    it('should detect valid public packages', async () => {
      const pkg1: PackageJson = {
        name: 'test-package-1',
        version: '1.0.0',
      }
      await writeFile(join(testDir, 'package.json'), JSON.stringify(pkg1))

      const packages = await getValidPackageNames({ cwd: testDir })
      expect(packages).toContain('test-package-1')
    })

    it('should ignore private packages', async () => {
      const pkg: PackageJson = {
        name: 'private-package',
        version: '1.0.0',
        private: true,
      }
      await writeFile(join(testDir, 'package.json'), JSON.stringify(pkg))

      const packages = await getValidPackageNames({ cwd: testDir })
      expect(packages).not.toContain('private-package')
    })

    it('should ignore packages without name', async () => {
      // @ts-expect-error no name
      const pkg: PackageJson = {
        version: '1.0.0',
      }
      await writeFile(join(testDir, 'package.json'), JSON.stringify(pkg))

      const packages = await getValidPackageNames({ cwd: testDir })
      expect(packages).toHaveLength(0)
    })

    it('should ignore packages without version', async () => {
      // @ts-expect-error no version
      const pkg: PackageJson = {
        name: 'test-package',
      }
      await writeFile(join(testDir, 'package.json'), JSON.stringify(pkg))

      const packages = await getValidPackageNames({ cwd: testDir })
      expect(packages).toHaveLength(0)
    })

    it('should detect multiple packages', async () => {
      const pkg1: PackageJson = {
        name: 'test-package-1',
        version: '1.0.0',
      }
      const pkg2: PackageJson = {
        name: 'test-package-2',
        version: '2.0.0',
      }

      await writeFile(join(testDir, 'package.json'), JSON.stringify(pkg1))
      await mkdir(join(testDir, 'packages', 'pkg2'), { recursive: true })
      await writeFile(
        join(testDir, 'packages', 'pkg2', 'package.json'),
        JSON.stringify(pkg2),
      )

      const packages = await getValidPackageNames({ cwd: testDir })
      expect(packages).toContain('test-package-1')
      expect(packages).toContain('test-package-2')
      expect(packages).toHaveLength(2)
    })

    it('should include additional packages from include option', async () => {
      const packages = await getValidPackageNames({
        cwd: testDir,
        include: ['extra-package-1', 'extra-package-2'],
      })
      expect(packages).toContain('extra-package-1')
      expect(packages).toContain('extra-package-2')
    })

    it('should exclude packages from exclude option', async () => {
      const pkg: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
      }
      await writeFile(join(testDir, 'package.json'), JSON.stringify(pkg))

      const packages = await getValidPackageNames({
        cwd: testDir,
        exclude: ['test-package'],
      })
      expect(packages).not.toContain('test-package')
    })

    it('should respect ignore patterns', async () => {
      const pkg: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
      }
      await mkdir(join(testDir, 'docs'), { recursive: true })
      await writeFile(
        join(testDir, 'docs', 'package.json'),
        JSON.stringify(pkg),
      )

      const packages = await getValidPackageNames({ cwd: testDir })
      expect(packages).not.toContain('test-package')
    })

    it('should include optionalDependencies when withOptional is true', async () => {
      const pkg: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        optionalDependencies: {
          'optional-dep-1': '^1.0.0',
          'optional-dep-2': '^2.0.0',
        },
      }
      await writeFile(join(testDir, 'package.json'), JSON.stringify(pkg))

      const packages = await getValidPackageNames({
        cwd: testDir,
        withOptional: true,
      })
      expect(packages).toContain('test-package')
      expect(packages).toContain('optional-dep-1')
      expect(packages).toContain('optional-dep-2')
    })

    it('should deduplicate package names', async () => {
      const packages = await getValidPackageNames({
        cwd: testDir,
        include: ['pkg-a', 'pkg-b', 'pkg-a', 'pkg-b'],
      })
      expect(packages).toStrictEqual(['pkg-a', 'pkg-b'])
    })

    it('should work with custom ignore patterns', async () => {
      const pkg: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
      }
      await mkdir(join(testDir, 'custom'), { recursive: true })
      await writeFile(
        join(testDir, 'custom', 'package.json'),
        JSON.stringify(pkg),
      )

      const packages = await getValidPackageNames({
        cwd: testDir,
        ignore: ['**/custom/**'],
      })
      expect(packages).not.toContain('test-package')
    })

    it('should disable default ignore when defaultIgnore is false', async () => {
      const pkg: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
      }
      await mkdir(join(testDir, 'docs'), { recursive: true })
      await writeFile(
        join(testDir, 'docs', 'package.json'),
        JSON.stringify(pkg),
      )

      const packages = await getValidPackageNames({
        cwd: testDir,
        defaultIgnore: false,
      })
      expect(packages).toContain('test-package')
    })
  })

  describe(syncNpmPackages, () => {
    it('should throw error for invalid target', async () => {
      await expect(
        syncNpmPackages('test-package', { target: 'invalid' as any }),
      ).rejects.toThrow('Required option target to be one of npmmirror')
    })

    it('should resolve with undefined for empty input', async () => {
      await expect(
        syncNpmPackages([], { target: 'npmmirror' }),
      ).resolves.toBeUndefined()
    })

    it('should fail sync when registry config is invalid', async () => {
      await expect(
        syncNpmPackages('test-package', {
          target: 'npmmirror',
          registry: 'http://registry.example.com',
          retry: 0,
          silent: true,
        }),
      ).rejects.toThrow('Failed to sync 1 package(s)')
    })

    it('should fail sync when registry host is private', async () => {
      await expect(
        syncNpmPackages('test-package', {
          target: 'npmmirror',
          registry: '127.0.0.1',
          retry: 0,
          silent: true,
        }),
      ).rejects.toThrow('Failed to sync 1 package(s)')
    })

    it('should fail sync when custom target misses path template', async () => {
      await expect(
        syncNpmPackages('test-package', {
          target: 'custom',
          registry: 'registry.example.com',
          retry: 0,
          silent: true,
        }),
      ).rejects.toThrow('Failed to sync 1 package(s)')
    })

    it('should reject regardless of silent mode', async () => {
      const base = {
        target: 'npmmirror' as const,
        registry: 'http://registry.example.com',
        retry: 0,
      }

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const writeSpy = vi
        .spyOn(process.stdout, 'write')
        .mockReturnValue(true)

      try {
        await expect(
          syncNpmPackages('test-package', {
            ...base,
            silent: false,
          }),
        ).rejects.toThrow('Failed to sync 1 package(s)')

        await expect(
          syncNpmPackages('test-package', {
            ...base,
            silent: true,
          }),
        ).rejects.toThrow('Failed to sync 1 package(s)')
      } finally {
        writeSpy.mockRestore()
        logSpy.mockRestore()
      }
    })
  })

  describe('transport helpers', () => {
    it('should encode scoped package names in request path', () => {
      expect(buildSyncRequestPath('@scope/pkg')).toBe(
        '/-/package/%40scope%2Fpkg/syncs',
      )
    })

    it('should accept host-only registry input', () => {
      expect(normalizeRegistryHost('registry.example.com')).toBe(
        'registry.example.com',
      )
    })

    it('should accept https URL registry input', () => {
      expect(normalizeRegistryHost('https://registry.example.com')).toBe(
        'registry.example.com',
      )
    })

    it('should reject non-https registry URLs', () => {
      expect(() =>
        normalizeRegistryHost('http://registry.example.com'),
      ).toThrow('Registry must use https protocol')
    })

    it('should reject private registry hosts', () => {
      expect(() => normalizeRegistryHost('127.0.0.1')).toThrow(
        'Registry host must be a public host',
      )
    })

    it('should build custom sync request path from template', () => {
      expect(
        buildCustomSyncRequestPath('@scope/pkg', '/sync/{packageName}'),
      ).toBe('/sync/%40scope%2Fpkg')
    })

    it('should reject custom template without placeholder', () => {
      expect(() => buildCustomSyncRequestPath('pkg', '/sync/pkg')).toThrow(
        'syncPathTemplate must include {packageName} placeholder',
      )
    })

    it('should resolve request for npmmirror target', () => {
      expect(
        resolveSyncRequest('@scope/pkg', {
          target: 'npmmirror',
        }),
      ).toStrictEqual({
        method: 'PUT',
        path: '/-/package/%40scope%2Fpkg/syncs',
      })
    })

    it('should resolve request for custom target', () => {
      expect(
        resolveSyncRequest('@scope/pkg', {
          target: 'custom',
          syncMethod: 'POST',
          syncPathTemplate: '/api/sync/{packageName}',
        }),
      ).toStrictEqual({
        method: 'POST',
        path: '/api/sync/%40scope%2Fpkg',
      })
    })
  })
})
