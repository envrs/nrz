import { uninstall } from '@nrz/graph'
import type { Graph, LinkSkillsResult } from '@nrz/graph'
import { commandUsage } from '../config/usage.js'
import type { CommandFn, CommandUsage } from '../index.js'
import { parseRemoveArgs } from '../parse-add-remove-args.js'
import { lazyView } from '../view.js'
import type { Views } from '../view.js'

export type UninstallResult = {
  /**
   * The resulting graph structure at the end of an uninstall.
   */
  graph: Graph
  /**
   * Agent skill links added or removed.
   */
  skills?: LinkSkillsResult
}

export const needsRegistry = true
export const needsNpmRegistry = true

export const usage: CommandUsage = () =>
  commandUsage({
    command: 'uninstall',
    usage: '[package ...]',
    description: `The opposite of \`nrz install\`. Removes deps and updates
                  nrz-lock.json and package.json appropriately.`,
    options: {
      workspace: {
        value: '<path|glob>',
        description:
          'Limit uninstall targets to matching workspaces.',
      },
      'workspace-group': {
        value: '<name>',
        description: 'Limit uninstall targets to workspace groups.',
      },
      'lockfile-only': {
        description:
          'Only update lockfile and package.json files; skip node_modules operations.',
      },
      'allow-scripts': {
        value: '<query>',
        description:
          'Filter which packages are allowed to run lifecycle scripts using DSS query syntax.',
      },
    },
  })

export const views = {
  json: i => i.graph.toJSON(),
  human: lazyView(
    async () =>
      (await import('./install/reporter.ts')).InstallReporter,
  ),
} as const satisfies Views<UninstallResult>

export const command: CommandFn<UninstallResult> = async conf => {
  const { monorepo, scurry } = conf.options
  const { remove } = parseRemoveArgs(conf, scurry, monorepo)
  /* c8 ignore start */
  const allowScripts =
    conf.get('allow-scripts') ?
      String(conf.get('allow-scripts'))
    : ':not(*)'
  /* c8 ignore stop */
  const { graph, skills } = await uninstall(
    {
      ...conf.options,
      allowScripts,
      allowSkills: conf.get('allow-skills'),
      skillsDirs: conf.get('skills-dir'),
      lockfileOnly: conf.options['lockfile-only'],
    },
    remove,
  )
  return { graph, ...(skills ? { skills } : null) }
}
