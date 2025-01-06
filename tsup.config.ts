import { defineConfig } from 'tsup'
import type { Options } from 'tsup'

const sharedOptions: Options = {
  clean: true,
  target: ['es2022', 'node18'],
}

export default defineConfig([
  {
    ...sharedOptions,
    cjsInterop: true,
    dts: true,
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    shims: true,
  },
  {
    ...sharedOptions,
    entry: ['src/cli.ts'],
    format: ['esm'],
  },
])
