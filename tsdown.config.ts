import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    clean: true,
    dts: true,
    entry: ['src/index.ts'],
    noExternal: ['@ntnyq/utils'],
    platform: 'node',
  },
  {
    clean: true,
    dts: false,
    entry: ['src/cli.ts'],
    platform: 'node',
  },
])
