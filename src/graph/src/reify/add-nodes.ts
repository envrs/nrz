import type { PackageInfoClient } from '@nrz/package-info'
import type { RollbackRemove } from '@nrz/rollback-remove'
import type { SpecOptions } from '@nrz/spec'
import type { PathScurry } from 'path-scurry'
import type { Diff } from '../diff.js'
import { extractNode } from './extract-node.js'

export const addNodes = (
  diff: Diff,
  scurry: PathScurry,
  remover: RollbackRemove,
  options: SpecOptions,
  packageInfo: PackageInfoClient,
): (() => Promise<unknown>)[] => {
  const actions: (() => Promise<unknown>)[] = []
  // fetch and extract all the nodes, removing any in the way
  for (const node of diff.nodes.add) {
    // if it's not in the store, we don't have to extract it, because
    // we're just linking to a location that already exists.
    if (!node.inNrzStore()) continue

    // skip nodes that have already been extracted
    if (node.extracted) continue

    actions.push(() =>
      extractNode(node, scurry, remover, options, packageInfo, diff),
    )
  }
  return actions
}
