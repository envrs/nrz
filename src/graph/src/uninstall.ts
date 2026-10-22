import type { PackageInfoClient } from '@nrz/package-info'
import type { LoadOptions } from './actual/load.js'
import { load as actualLoad } from './actual/load.js'
import type { RemoveImportersDependenciesMap } from './dependencies.js'
import { GraphModifier } from './modifiers.js'
import { build as idealBuild } from './ideal/build.js'
import { reify } from './reify/index.js'
import type { ReifyResult } from './reify/index.js'
import { lockfile } from './index.js'
import { updatePackageJson } from './reify/update-importers-package-json.js'
import { RollbackRemove } from '@nrz/rollback-remove'
import { Monorepo } from '@nrz/workspaces'
import { existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { assertQuery } from './filter-nodes-by-query.js'
import type { Graph } from './graph.js'
import { assertSkillsDirs } from './skills/dirs.js'
import type { LinkSkillsResult } from './skills/index.js'

export type UninstallOptions = LoadOptions & {
  packageInfo: PackageInfoClient
  allowScripts: string
  /**
   * DSS query: packages whose agent skills get linked into the
   * project's agent skill dirs after uninstall. Selectors may end with
   * `:skill()`. Unset or `:not(*)`: none.
   */
  allowSkills?: string
  /**
   * agent skill dirs, relative to projectRoot. Unset: detect; `[]`:
   * none
   */
  skillsDirs?: string[]
}

/**
 * Result of {@link uninstall}.
 */
export type UninstallResult = {
  graph: Graph
  diff?: ReifyResult
  /** skill links added or removed, if any */
  skills?: LinkSkillsResult
}

export const uninstall = async (
  options: UninstallOptions,
  remove?: RemoveImportersDependenciesMap,
): Promise<UninstallResult> => {
  // unset or `:not(*)`: no skills work at all, the skills code never
  // loads
  const allowSkills =
    options.allowSkills === ':not(*)' ?
      undefined
    : options.allowSkills
  // fail before uninstalling, not after
  if (allowSkills) {
    await assertQuery(allowSkills, 'allow-skills', ['skill'])
    assertSkillsDirs(options.projectRoot, options.skillsDirs)
  }
  const mainManifest = options.packageJson.read(options.projectRoot)
  const modifiers = GraphModifier.maybeLoad(options)
  const remover = new RollbackRemove()
  // graph spans every workspace; -w only picks the `remove` targets
  const monorepo = Monorepo.maybeLoad(options.projectRoot, {
    packageJson: options.packageJson,
    scurry: options.scurry,
  })

  let result: UninstallResult
  try {
    // Load the actual graph before building the ideal graph so that
    // manifest data from installed packages can be used to hydrate
    // nodes loaded from the lockfile. Without this, nodes loaded from
    // nrz-lock.json (which does not store manifests) will be missing
    // manifest data, causing the hidden lockfile save to silently fail
    // due to throwOnMissingManifest and leaving stale entries behind.
    const act = actualLoad({
      ...options,
      monorepo,
      modifiers: undefined,
      mainManifest,
      loadManifests: true,
    })
    const graph = await idealBuild({
      ...options,
      monorepo,
      actual: act,
      remove,
      mainManifest,
      loadManifests: true,
      modifiers,
      remover,
    })

    // If lockfileOnly is enabled, skip reify and only save the lockfile
    if (options.lockfileOnly) {
      // Save only the main lockfile, skip all filesystem operations.
      // Spread `options` so that spec-level config (registry,
      // scoped-registries, git-hosts, catalogs, etc.) round-trips
      // through the lockfile. See nrz/nrz#1580.
      lockfile.save({ ...options, graph, modifiers })
      const saveImportersPackageJson =
        /* c8 ignore next */
        remove?.modifiedDependencies ?
          updatePackageJson({
            ...options,
            remove,
            graph,
          })
        : undefined
      saveImportersPackageJson?.()
      // see install.ts: never leave `.NRZ.DELETE.*` behind
      remover.confirm()
      return { graph, diff: undefined }
    }

    const diff = await reify({
      ...options,
      remove,
      actual: act,
      graph,
      loadManifests: true,
      modifiers,
      remover,
    })
    result = { graph, diff }
    /* c8 ignore start */
  } catch (err) {
    await remover.rollback().catch(() => {})
    // Remove hidden lockfile on failure
    try {
      const hiddenLockfile = resolve(
        options.projectRoot,
        'node_modules/.nrz-lock.json',
      )
      if (existsSync(hiddenLockfile)) {
        rmSync(hiddenLockfile, { force: true })
      }
    } catch {}
    throw err
  }
  /* c8 ignore stop */

  // after the try: a link failure must not roll back the uninstall
  if (!allowSkills) return result
  const { linkSkills } = await import('./skills/index.js')
  result.skills = await linkSkills({
    ...options,
    graph: result.graph,
    target: allowSkills,
  })
  return result
}
