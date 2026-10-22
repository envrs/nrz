import { format } from 'node:util'
import { asRootError, findRootError } from '@nrz/output/error'
import { setNrzJsonOnly } from '@nrz/workspaces'
import { loadPackageJson } from 'package-json-from-dist'
import {
  getSortedCliOptions,
  getSortedKeys,
} from './config/definition.js'
import { Config } from './config/index.js'
import {
  flushAndExit,
  outputCommand,
  stderr,
  stdout,
} from './output.js'
import { indent } from './print-err.js'
import { loadCommand } from './load-command.js'

export type {
  Command,
  CommandFn,
  CommandUsage,
} from './load-command.js'

const { version } = loadPackageJson(
  import.meta.filename,
  process.env.__NRZ_INTERNAL_CLI_PACKAGE_JSON,
) as {
  version: string
}

const loadNrz = async (cwd: string, argv: string[]) => {
  try {
    return await Config.load(cwd, argv)
  } catch (e) {
    const code =
      findRootError(e, { code: 'ECONFIG' }) ? 'ECONFIG' : 'JACKSPEAK'
    const err = asRootError(e, { code })
    const { found, path, wanted, name } = err.cause
    const isConfigFile = typeof path === 'string'
    const msg =
      isConfigFile ? `Problem in Config File ${path}`
      : code === 'ECONFIG' ? 'Config Error'
      : 'Invalid Option Flag'
    const validOptions =
      wanted || code === 'ECONFIG' ? undefined
      : isConfigFile ? getSortedKeys()
      : getSortedCliOptions()
    stderr(msg)
    stderr(err.message)
    if (name) stderr(indent(`Field: ${format(name)}`))
    if (found) {
      stderr(
        indent(
          `Found: ${isConfigFile ? JSON.stringify(found) : format(found)}`,
        ),
      )
    }
    if (wanted) stderr(indent(`Wanted: ${format(wanted)}`))
    if (validOptions) {
      stderr(indent('Valid Options:'))
      stderr(indent(validOptions.join('\n'), 4))
    }
    // `nrz help` would fail the same way
    if (code !== 'ECONFIG') {
      stderr(
        indent(
          `Run 'nrz help' for more information about available options.`,
        ),
      )
    }
    return flushAndExit(process.exitCode || 1)
  }
}

const run = async () => {
  const start = Date.now()
  const cwd = process.cwd()
  const nrz = await loadNrz(cwd, process.argv)

  if (nrz.get('version')) {
    return stdout(version)
  }

  // ci reads workspaces from nrz.json only; set before options load
  setNrzJsonOnly(nrz.command === 'ci')
  const { monorepo } = nrz.options

  // Infer the workspace by being in that directory.
  if (nrz.get('workspace') === undefined) {
    const ws = monorepo?.get(cwd)
    if (ws) {
      nrz.values.workspace = [ws.path]
      nrz.options.workspace = [ws.path]
    }
  }

  if (
    nrz.command !== 'init' &&
    (nrz.get('workspace') || nrz.get('workspace-group')) &&
    ![...(monorepo?.values() ?? [])].length
  ) {
    const where =
      nrz.command === 'ci' ?
        'the nrz.json config (nrz ci ignores package.json and pnpm-workspace.yaml)'
      : 'the nrz.json config, the "workspaces" field of the root package.json, or the "packages" list of pnpm-workspace.yaml'
    stderr(
      `Error: No matching workspaces found. Make sure ${where} contains the correct workspaces.`,
    )
    if (nrz.get('workspace')) {
      stderr(indent(`Workspace: ${format(nrz.get('workspace'))}`))
    }
    if (nrz.get('workspace-group')) {
      stderr(
        indent(
          `Workspace Group: ${format(nrz.get('workspace-group'))}`,
        ),
      )
    }
    return flushAndExit(process.exitCode || 1)
  }

  if (nrz.command === 'registry') {
    const { dispatchRegistry } =
      await import('./commands/registry.js')
    await dispatchRegistry(nrz)
  }

  const command = await loadCommand(nrz.command)
  await outputCommand(command, nrz, { start, nrzVersion: version })
}

export default run
