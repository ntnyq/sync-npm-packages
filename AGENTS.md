# AGENTS

## Project Intent

`sync-npm-packages` syncs published npm packages to mirror registries (currently `npmmirror`) via CLI and library APIs.

## Fast Start

- Use Node `^22.13.0 || >=24`.
- Use `pnpm` (`packageManager: pnpm@11.3.0`).
- Install deps: `pnpm install --frozen-lockfile`

## Validation Commands

- Format check: `pnpm run format:check`
- Lint: `pnpm run lint`
- Type check: `pnpm run typecheck`
- Tests: `pnpm test`
- Build: `pnpm run build`
- CI-equivalent local check sequence:
  `pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run build`

## Architecture Map

- `src/cli.ts`: CLI entrypoint (parses flags, resolves config, prints output, exits on errors)
- `src/config.ts`: config loading via `unconfig` (`sync.config.*` and `.syncrc.json`), CLI options override file config
- `src/core.ts`: package discovery + sync engine (retry, concurrency, cache, progress)
- `src/utils.ts`: validation helpers (`assertSyncTarget`, package visibility checks)
- `src/types.ts`: public option/type contracts
- `src/index.ts`: public exports

## Agent Conventions

- Keep ESM-only compatibility (`type: module`).
- Prefer small, targeted changes in one module at a time.
- Preserve current toolchain choices (`tsdown`, `oxlint`, `oxfmt`, `vitest`, `tsgo`).
- When changing public options or behavior, update both runtime code and related types.
- For behavior changes in detection/sync/config, add or update tests in `tests/`.

## Testing Notes

- `tests/core.test.ts` creates and cleans temporary workspace fixtures under `tests/fixtures/test-workspace` in hooks.
- Some sync tests do not mock network I/O deeply; avoid introducing flaky network-dependent assertions.

## Project Pitfalls

- `target` is currently constrained to `npmmirror`; validation is enforced.
- Default package detection ignores `docs`, `tests`, `examples`, `fixtures`, `playground`, `.git`, and `node_modules`.
- Config merging is shallow and precedence is CLI over file config.

## References

- Project usage and API: [README.md](README.md)
- Additional usage scenarios: [docs/EXAMPLES.md](docs/EXAMPLES.md)
- JSON config schema: [schemas/syncrc.json](schemas/syncrc.json)
- CI checks: [.github/workflows/ci.yml](.github/workflows/ci.yml)
- Release flow: [.github/workflows/release.yml](.github/workflows/release.yml)
