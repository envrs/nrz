export * from './build.js'
export * from './edge.js'
export * from './graph.js'
export * from './node.js'
export * from './dependencies.js'
export * from './fixup-added-names.js'
export * from './lockfile/types.js'
export * from './visualization/json-output.js'
export * from './visualization/human-readable-output.js'
export * from './visualization/mermaid-output.js'
export * from './stringify-node.js'
export * from './install.js'
export * from './uninstall.js'
export * from './update.js'
export * from './diff.js'
export * from './modifiers.js'
export * from './virtual-root.js'
// types only: the skills code loads when first used (installs with
// allow-skills unset never load it)
export type {
  DiscoveredSkills,
  LinkSkillsOptions,
  LinkSkillsResult,
  ListSkillsResult,
  MountResult,
  Skill,
  SkillFrontmatter,
  SkillMount,
  SkillRow,
  SkillsDir,
  SkillsOptions,
  UnmatchedPattern,
  UnscannedSkills,
} from './skills/index.js'
export { hasSkills, linkSkills, listSkills } from './skills/lazy.js'
export { assertQuery } from './filter-nodes-by-query.js'

import { load as actualLoad } from './actual/load.js'
import type { LoadOptions as ActualLoadOptions } from './actual/load.js'
export const actual = { load: actualLoad }

import {
  load as lockfileLoad,
  loadData as lockfileLoadData,
} from './lockfile/load.js'
import type { LoadOptions as LockfileLoadOptions } from './lockfile/load.js'
import { loadEdges } from './lockfile/load-edges.js'
import { loadNodes } from './lockfile/load-nodes.js'
import { save } from './lockfile/save.js'
export const lockfile = {
  load: lockfileLoad,
  loadData: lockfileLoadData,
  loadEdges,
  loadNodes,
  save,
}

export type { ActualLoadOptions, LockfileLoadOptions }
export type { SaveOptions } from './lockfile/save.js'

import { build } from './ideal/build.js'
import type { BuildIdealOptions } from './ideal/build.js'
export type { BuildIdealOptions }
export const ideal = { build }

export { reify } from './reify/index.js'
export type { ReifyOptions } from './reify/index.js'
export type { BuildResult } from './reify/build.js'
