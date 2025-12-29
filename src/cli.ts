import process from 'node:process'
import { cac } from 'cac'
import c from 'tinyrainbow'
import { name, version } from '../package.json'
import { resolveConfig } from './config'
import { getValidPackageNames, syncNpmPackages } from './core'
import { assertSyncTarget } from './utils'
import type { Options } from './types'

const cli = cac(name)

cli
  .version(version)
  .option('--debug', 'Enable debug mode')
  .option('--cwd [cwd]', 'Current working directory')
  .option('--target [target]', 'The mirror site preset')
  .option('--ignore [ignore]', 'Ignore package.json pattern')
  .option('--include [include]', 'Additional packages to sync')
  .option('--exclude [exclude]', 'Exclude packages from being synced')
  .option('--with-optional', 'With optionalDependencies in package.json')
  .option('--no-default-ignore', 'Disable default ignore patterns')
  .option('--dry', 'Dry run')
  .help()

cli.command('').action(async (options: Options) => {
  try {
    const resolvedConfig = await resolveConfig(options)

    assertSyncTarget(resolvedConfig.target)

    console.log(`\n${c.bold(c.magenta(name))} ${c.dim(`v${version}`)}`)
    console.log(c.dim('--------------'))

    const packages = await getValidPackageNames(resolvedConfig)

    if (!packages.length) {
      console.log(c.red('No packages detected.'))
      return
    }

    function printPackages() {
      console.log(c.dim('\nDetected packages to sync:'))

      for (const pkg of packages) {
        console.log(`- ${c.cyan(c.bold(pkg))}`)
      }

      console.log()
    }

    if (resolvedConfig.dry) {
      console.log(c.yellow('\nDry run, sync is skipped.'))
      printPackages()
      return
    }

    // target has been asserted before
    await syncNpmPackages(packages, resolvedConfig as Options)

    console.log(c.green('Sync successfully!'))
  } catch (err) {
    console.error(c.red(String(err)))

    if (err instanceof Error && err.stack) {
      console.error(c.dim(err.stack?.split('\n').slice(1).join('\n')))
    }

    process.exit(1)
  }
})

cli.parse()
