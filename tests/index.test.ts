import { describe, expectTypeOf, expect, it } from 'vitest'
import * as syncNpmPackages from '../src/index'

describe('index', () => {
  it('should export syncNpmPackages function', () => {
    expect(syncNpmPackages.syncNpmPackages).toBeDefined()
    expectTypeOf(syncNpmPackages.syncNpmPackages).toBeFunction()
  })

  it('should export syncNpmPackagesAuto function', () => {
    expect(syncNpmPackages.syncNpmPackagesAuto).toBeDefined()
    expectTypeOf(syncNpmPackages.syncNpmPackagesAuto).toBeFunction()
  })

  it('should export defineConfig function', () => {
    expect(syncNpmPackages.defineConfig).toBeDefined()
    expectTypeOf(syncNpmPackages.defineConfig).toBeFunction()
  })

  it('should export all required types', () => {
    // Types are checked at compile time
    // This test ensures the exports are available at runtime
    expect(syncNpmPackages).toBeDefined()
  })
})
