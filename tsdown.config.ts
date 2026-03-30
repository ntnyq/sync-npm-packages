import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    clean: true,
    deps: {
      onlyBundle: ['@ntnyq/utils'],
    },
    dts: {
      tsgo: true,
    },
    entry: ['src/index.ts'],
    minify: 'dce-only',
    platform: 'node',
  },
  {
    clean: true,
    deps: {
      onlyBundle: ['@ntnyq/utils'],
    },
    dts: false,
    entry: ['src/cli.ts'],
    minify: 'dce-only',
    platform: 'node',
  },
])
