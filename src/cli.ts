import process from 'node:process'
import { cac } from 'cac'
import c from 'tinyrainbow'
import { version } from '../package.json'
import { assertSyncTarget } from './utils'
import { getValidPackageNames, resolveConfig, syncNpmPackages } from '.'
import type { Options } from './types'

const cli = cac('sync-npm-packages')

cli
  .version(version)
  .option('--debug', 'Enable debug mode')
  .option('--cwd [cwd]', 'Current working directory')
  .option('--target [target]', 'The mirror site preset')
  .option('--ignore [ignore]', 'Ignore package.json pattern')
  .option('--no-default-ignore', 'Disable default ignore patterns')
  .option('--dry', 'Dry run')
  .help()

cli.command('').action(async (options: Options) => {
  try {
    // TODO: defaultIgnore is default to true
    if (options.defaultIgnore) {
      delete options.defaultIgnore
    }

    const resolvedConfig = await resolveConfig(options)

    assertSyncTarget(resolvedConfig.target)

    console.log()
    console.log(`${c.bold(c.magenta('sync-npm-packages'))} ${c.dim(`v${version}`)}`)
    console.log(c.dim('--------------'))

    const packages = await getValidPackageNames(resolvedConfig)

    if (!packages.length) {
      console.log(c.red('No packages founded.'))
      return
    }

    function printPackages() {
      console.log()
      console.log(c.dim('Detected packages to sync:'))

      for (const pkg of packages) {
        console.log(`- ${c.cyan(c.bold(pkg))}`)
      }

      console.log()
    }

    if (resolvedConfig.dry) {
      console.log()
      console.log(c.yellow('Dry run, sync is skiped.'))
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
