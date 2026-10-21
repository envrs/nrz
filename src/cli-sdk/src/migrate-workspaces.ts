import { save } from '@nrz/nrz-json'
import {
  migratableWSConfig,
  resolveWSConfig,
} from '@nrz/workspaces'
import type { WorkspaceConfigSource } from '@nrz/workspaces'
import type { LoadedConfig } from './config/index.ts'
import { stderr } from './output.ts'

export type MigratedWorkspaces = {
  source: WorkspaceConfigSource
  workspaces: string[]
}

// workspaces declared outside nrz.json, if any
const found = (
  conf: LoadedConfig,
): MigratedWorkspaces | undefined => {
  const resolved = resolveWSConfig(
    conf.options.projectRoot,
    conf.options.packageJson,
    false,
  )
  const workspaces = migratableWSConfig(resolved)
  const { source } = resolved
  if (!workspaces?.length || !source) return
  return { source, workspaces }
}

/**
 * Save workspaces read from `package.json` or `pnpm-workspace.yaml` to
 * the project `nrz.json`, unless `--no-migrate-workspaces`.
 */
export const migrateWorkspaces = (
  conf: LoadedConfig,
): MigratedWorkspaces | undefined => {
  if (!conf.options['migrate-workspaces']) return
  const migrated = found(conf)
  if (migrated) save('workspaces', migrated.workspaces)
  return migrated
}

/**
 * Warn when workspaces are declared only outside `nrz.json`, which
 * `nrz ci` ignores.
 */
export const warnIgnoredWorkspaces = (conf: LoadedConfig): void => {
  const { loglevel } = conf.values
  if (loglevel === 'silent' || loglevel === 'error') return
  let migrated: MigratedWorkspaces | undefined
  try {
    migrated = found(conf)
  } catch {
    // invalid workspaces config: nothing to suggest
    return
  }
  if (!migrated) return
  stderr(
    `Warning: nrz ci reads workspaces from nrz.json only; ignoring ${migrated.source}, its workspaces are not installed. Run \`nrz install\` to save them to nrz.json, or add them there.`,
  )
}
