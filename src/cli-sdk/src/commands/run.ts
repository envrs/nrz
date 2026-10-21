import { run, runFG } from '@nrz/run'
import type { LoadedConfig } from '../config/index.js'
import { commandUsage } from '../config/usage.js'
import type {
  ExecResult,
  MultiScriptSet,
  ScriptSet,
} from '../exec-command.js'
import { ExecCommand } from '../exec-command.js'
import type { CommandFn, CommandUsage } from '../index.js'

export { views } from '../exec-command.js'

export const usage: CommandUsage = () =>
  commandUsage({
    command: 'run',
    usage: '<script> [args ...]',
    description: `Run a script defined in 'package.json', passing along any extra
                  arguments. Note that nrz config values must be specified *before*
                  the script name, because everything after that is handed off to
                  the script process.`,
    options: {
      scope: {
        value: '<query>',
        description: 'Filter execution targets using a DSS query.',
      },
      workspace: {
        value: '<path|glob>',
        description:
          'Limit execution to matching workspace paths or globs.',
      },
      'workspace-group': {
        value: '<name>',
        description: 'Limit execution to named workspace groups.',
      },
      recursive: {
        description: 'Run across all selected workspaces.',
      },
      'if-present': {
        description:
          'When running across multiple packages, only include packages with matching scripts.',
      },
      bail: {
        description:
          'When running across multiple workspaces, stop on first failure.',
      },
      'script-shell': {
        value: '<program>',
        description:
          'Shell to use when executing package.json scripts.',
      },
    },
  })

class RunCommand extends ExecCommand<typeof run, typeof runFG> {
  constructor(conf: LoadedConfig) {
    super(conf, run, runFG)
  }

  // do not provide the interactive shell arg, just do nothing
  // so that it falls back up to the noArgsSingle() method
  defaultArg0(): undefined {}

  noArgsSingle(): ScriptSet {
    // called when there's no arg0, with a single workspace or root
    const cwd = this.getCwd()
    const { scripts = {} } = this.conf.options.packageJson.read(cwd)
    return scripts
  }

  noArgsMulti(): MultiScriptSet {
    const scripts: MultiScriptSet = {}
    for (const { label, manifest } of this.getTargets()) {
      if (manifest.scripts) scripts[label] = manifest.scripts
    }
    return scripts
  }
}

export const command: CommandFn<ExecResult> = async conf =>
  await new RunCommand(conf).run()
