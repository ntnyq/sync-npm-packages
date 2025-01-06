import { defineConfig } from 'tsup'

export default defineConfig({
  cjsInterop: true,
  clean: true,
  dts: true,
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['cjs', 'esm'],
  shims: true,
  target: ['es2022', 'node18'],
})
