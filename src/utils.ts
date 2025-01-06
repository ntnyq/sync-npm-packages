import type { PackageJson } from './types'

export function toArray<T>(value?: T | T[] | null): T[] {
  value ??= []
  return Array.isArray(value) ? value : [value]
}

export function isValidPublicPackage(packageJson: PackageJson) {
  if (packageJson.private) return
  return packageJson.name && packageJson.version
}

export const SUPPORTED_TARGETS = ['npmmirror']

export function assertSyncTarget(target: string) {
  if (!SUPPORTED_TARGETS.includes(target)) {
    throw new Error(`Required option target to be one of ${JSON.stringify(SUPPORTED_TARGETS)}`)
  }
}
