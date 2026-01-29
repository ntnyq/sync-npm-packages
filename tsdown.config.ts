import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    clean: true,
    dts: true,
    entry: ['src/index.ts'],
    inlineOnly: ['@ntnyq/utils'],
    minify: 'dce-only',
    platform: 'node',
  },
  {
    clean: true,
    dts: false,
    entry: ['src/cli.ts'],
    inlineOnly: ['@ntnyq/utils'],
    minify: 'dce-only',
    platform: 'node',
  },
])
