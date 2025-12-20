import { describe, expect, it } from 'vitest'
import { assertSyncTarget, isValidPublicPackage } from '../src/utils'
import type { PackageJson } from '../src/types'

describe('utils', () => {
  describe('isValidPublicPackage', () => {
    it('should return true for valid public package', () => {
      const pkg: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
      }
      expect(isValidPublicPackage(pkg)).toBe(true)
    })

    it('should return false for private package', () => {
      const pkg: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        private: true,
      }
      expect(isValidPublicPackage(pkg)).toBe(false)
    })

    it('should return false for package without name', () => {
      // @ts-expect-error no name
      const pkg: PackageJson = {
        version: '1.0.0',
      }
      expect(isValidPublicPackage(pkg)).toBe(false)
    })

    it('should return false for package without version', () => {
      // @ts-expect-error no version
      const pkg: PackageJson = {
        name: 'test-package',
      }
      expect(isValidPublicPackage(pkg)).toBe(false)
    })

    it('should return false for package without name and version', () => {
      // @ts-expect-error no required fields
      const pkg: PackageJson = {}
      expect(isValidPublicPackage(pkg)).toBe(false)
    })
  })

  describe('assertSyncTarget', () => {
    it('should not throw for valid target', () => {
      expect(() => assertSyncTarget('npmmirror')).not.toThrow()
    })

    it('should throw for invalid target', () => {
      expect(() => assertSyncTarget('invalid-target')).toThrow(
        'Required option target to be one of npmmirror',
      )
    })

    it('should throw for undefined target', () => {
      expect(() => assertSyncTarget(undefined)).toThrow(
        'Required option target to be one of npmmirror',
      )
    })

    it('should throw for empty string target', () => {
      expect(() => assertSyncTarget('')).toThrow(
        'Required option target to be one of npmmirror',
      )
    })
  })
})
