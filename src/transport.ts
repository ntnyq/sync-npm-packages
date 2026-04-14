import { request } from 'node:https'
import type { SyncOptions } from './types'

const DEFAULT_REQUEST_TIMEOUT = 10_000
const DEFAULT_REGISTRY_HOST = 'registry.npmmirror.com'

/**
 * Check whether an IPv4 hostname belongs to private/local ranges.
 * @param hostname - hostname in IPv4 format
 * @returns true when host is private or local IPv4
 */
function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map(Number)
  if (parts.length !== 4 || parts.some(part => Number.isNaN(part))) {
    return false
  }

  const [a, b] = parts

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  )
}

/**
 * Check whether an IPv6 hostname belongs to private/local ranges.
 * @param hostname - hostname in IPv6 format
 * @returns true when host is private or local IPv6
 */
function isPrivateIpv6(hostname: string): boolean {
  if (!hostname.includes(':')) {
    return false
  }

  const normalized = hostname.toLowerCase()
  return (
    normalized === '::1' ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd')
  )
}

/**
 * Validate whether a host is unsafe for outbound registry requests.
 * @param hostname - normalized hostname
 * @returns true when hostname points to localhost/private network
 */
function isUnsafeHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  return (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    isPrivateIpv4(normalized) ||
    isPrivateIpv6(normalized)
  )
}

/**
 * Normalize and validate registry host for outbound requests.
 * @param registry - registry host or HTTPS URL
 */
export function normalizeRegistryHost(registry?: string): string {
  const rawRegistry = (registry ?? DEFAULT_REGISTRY_HOST).trim()

  if (!rawRegistry) {
    throw new Error('Registry host cannot be empty')
  }

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//u.test(rawRegistry)
  const url = hasScheme
    ? new URL(rawRegistry)
    : new URL(`https://${rawRegistry}`)

  if (url.protocol !== 'https:') {
    throw new Error('Registry must use https protocol')
  }

  if (url.username || url.password) {
    throw new Error('Registry must not include credentials')
  }

  if (url.pathname && url.pathname !== '/') {
    throw new Error('Registry must not include path')
  }

  if (url.search || url.hash) {
    throw new Error('Registry must not include query or hash')
  }

  const host = url.hostname.toLowerCase()

  if (!host) {
    throw new Error('Registry host cannot be empty')
  }

  if (isUnsafeHost(host)) {
    throw new Error('Registry host must be a public host')
  }

  return host
}

/**
 * Build the npmmirror sync path and safely encode package names.
 * @param packageName - npm package name
 */
export function buildSyncRequestPath(packageName: string): string {
  const encodedPackageName = encodeURIComponent(packageName)
  return `/-/package/${encodedPackageName}/syncs`
}

/**
 * Build sync path for custom target.
 * @param packageName - npm package name
 * @param syncPathTemplate - custom sync path template
 * @returns sync path for custom registry
 */
export function buildCustomSyncRequestPath(
  packageName: string,
  syncPathTemplate?: string,
): string {
  if (!syncPathTemplate) {
    throw new Error(
      'syncPathTemplate is required when target is custom and must contain {packageName}',
    )
  }

  if (!syncPathTemplate.includes('{packageName}')) {
    throw new Error('syncPathTemplate must include {packageName} placeholder')
  }

  if (!syncPathTemplate.startsWith('/')) {
    throw new Error('syncPathTemplate must start with /')
  }

  const encodedPackageName = encodeURIComponent(packageName)
  return syncPathTemplate.replaceAll('{packageName}', encodedPackageName)
}

/**
 * Resolve request method and path for the configured target.
 * @param packageName - npm package name
 * @param options - sync options
 * @returns request method and path
 */
export function resolveSyncRequest(
  packageName: string,
  options: SyncOptions,
): { method: 'PUT' | 'POST' | 'PATCH'; path: string } {
  const method = options.syncMethod ?? 'PUT'

  if (options.target === 'custom') {
    return {
      method,
      path: buildCustomSyncRequestPath(packageName, options.syncPathTemplate),
    }
  }

  return {
    method,
    path: buildSyncRequestPath(packageName),
  }
}

/**
 * Sync package to npm mirror-compatible registry.
 * @param packageName - npm package name
 * @param options - sync options
 */
export async function syncPackageToRegistry(
  packageName: string,
  options: SyncOptions,
): Promise<void> {
  const timeout = options.timeout ?? DEFAULT_REQUEST_TIMEOUT
  const registryHost = normalizeRegistryHost(options.registry)
  const { method, path } = resolveSyncRequest(packageName, options)

  return new Promise<void>((resolve, reject) => {
    const req = request(
      {
        method,
        path,
        host: registryHost,
        protocol: 'https:',
        headers: {
          'content-length': 0,
        },
        timeout,
      },
      res => {
        let responseBody = ''

        res.on('data', chunk => {
          responseBody += chunk
        })

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve()
          } else {
            const errorMsg = responseBody
              ? `HTTP ${res.statusCode}: ${responseBody}`
              : `HTTP ${res.statusCode}`
            reject(new Error(`Failed to sync ${packageName}: ${errorMsg}`))
          }
        })
      },
    )

    req.on('error', err => {
      reject(new Error(`Failed to sync ${packageName}: ${err.message}`))
    })

    req.on('timeout', () => {
      req.destroy()
      reject(
        new Error(
          `Failed to sync ${packageName}: Request timeout after ${timeout}ms`,
        ),
      )
    })

    req.end()
  })
}
