import type { PackageJson } from './types'

/**
 * Converts a value to an array.
 *
 * @param value - The value to convert.
 * @returns The array.
 */
export function toArray<T>(value?: T | T[] | null): T[] {
  value ??= []
  return Array.isArray(value) ? value : [value]
}
/**
 * Returns a new array with unique values.
 *
 * @param array - The array to process.
 * @returns The new array.
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

/**
 * Check if given package json object is valid
 *
 * @param packageJson - package json object
 * @returns true if is a valid package json, false otherwise
 */
export function isValidPublicPackage(packageJson: PackageJson): boolean {
  if (packageJson.private) return false
  return !!(packageJson.name && packageJson.version)
}

export const SUPPORTED_TARGETS: string[] = ['npmmirror']

/**
 * Assert given target is a valid sync target
 *
 * @param target - target site
 */
export function assertSyncTarget(target?: string): void {
  if (!target || !SUPPORTED_TARGETS.includes(target)) {
    throw new Error(
      `Required option target to be one of ${SUPPORTED_TARGETS.join(', ')}`,
    )
  }
}
