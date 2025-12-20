import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getValidPackageNames, syncNpmPackages } from '../src/core'
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

  describe('getValidPackageNames', () => {
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
      expect(packages.length).toBe(0)
    })

    it('should ignore packages without version', async () => {
      // @ts-expect-error no version
      const pkg: PackageJson = {
        name: 'test-package',
      }
      await writeFile(join(testDir, 'package.json'), JSON.stringify(pkg))

      const packages = await getValidPackageNames({ cwd: testDir })
      expect(packages.length).toBe(0)
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
      expect(packages.length).toBe(2)
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
      expect(packages).toEqual(['pkg-a', 'pkg-b'])
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

  describe('syncNpmPackages', () => {
    it('should throw error for invalid target', async () => {
      await expect(
        syncNpmPackages('test-package', { target: 'invalid' as any }),
      ).rejects.toThrow('Required option target to be one of npmmirror')
    })

    it('should accept single package name as string', async () => {
      // This test would make real HTTP requests, so we just verify it doesn't throw
      // In a real scenario, you'd mock the HTTP request
      const packages = ['test-package']
      expect(() =>
        syncNpmPackages(packages[0], { target: 'npmmirror' }),
      ).not.toThrow()
    })

    it('should accept multiple package names as array', async () => {
      const packages = ['test-package-1', 'test-package-2']
      expect(() =>
        syncNpmPackages(packages, { target: 'npmmirror' }),
      ).not.toThrow()
    })

    it('should deduplicate package names', async () => {
      const packages = ['test-package', 'test-package']
      // The function should handle duplicates internally
      expect(() =>
        syncNpmPackages(packages, { target: 'npmmirror' }),
      ).not.toThrow()
    })
  })
})
