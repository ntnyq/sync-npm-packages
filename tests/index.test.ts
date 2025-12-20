import { describe, expect, it } from 'vitest'
import * as syncNpmPackages from '../src/index'

describe('index', () => {
  it('should export syncNpmPackages function', () => {
    expect(syncNpmPackages.syncNpmPackages).toBeDefined()
    expect(typeof syncNpmPackages.syncNpmPackages).toBe('function')
  })

  it('should export syncNpmPackagesAuto function', () => {
    expect(syncNpmPackages.syncNpmPackagesAuto).toBeDefined()
    expect(typeof syncNpmPackages.syncNpmPackagesAuto).toBe('function')
  })

  it('should export defineConfig function', () => {
    expect(syncNpmPackages.defineConfig).toBeDefined()
    expect(typeof syncNpmPackages.defineConfig).toBe('function')
  })

  it('should export all required types', () => {
    // Types are checked at compile time
    // This test ensures the exports are available at runtime
    expect(syncNpmPackages).toBeDefined()
  })
})
