import { hydrate } from '@nrz/dep-id'
import type {
  ExtractResolution,
  PackageInfoClient,
} from '@nrz/package-info'
import type { RollbackRemove } from '@nrz/rollback-remove'
import type { SpecOptions } from '@nrz/spec'
import { asManifest, normalizeManifest } from '@nrz/types'
import { lstatSync } from 'node:fs'
import type { PathScurry } from 'path-scurry'
import type { Diff } from '../diff.js'
import type { Node } from '../node.js'
import { isUnsupported, optionalFail } from './optional-fail.js'
import { removeOptionalSubgraph } from '../remove-optional-subgraph.js'

/**
 * Result of the extraction operation.
 * Either the extracted package data or an error if extraction failed.
 */
export type ExtractResult =
  | {
      success: true
      node: Node
    }
  | {
      success: false
      node: Node
      error: unknown
    }

/**
 * Returns a function that handles removing
 * a failed optional node from its graph.
 * Returns undefined for non-optional nodes when no diff is provided.
 */
const getOptionalFailedNodeRemover = (node: Node, diff?: Diff) => {
  return (
    diff ? optionalFail(diff, node)
    : node.isOptional() ?
      () => removeOptionalSubgraph(node.graph, node)
    : undefined
  )
}

/**
 * Extract a single node to the file system.
 * Returns a promise that resolves when the extraction is complete.
 */
export const extractNode = async (
  node: Node,
  scurry: PathScurry,
  remover: RollbackRemove,
  options: SpecOptions,
  packageInfo: PackageInfoClient,
  diff?: Diff,
): Promise<ExtractResult> => {
  node.extracted = true
  const target = node.resolvedLocation(scurry)
  const from = scurry.resolve('')
  const spec = hydrate(node.id, node.name, options)
  const removeOptionalFailedNode = getOptionalFailedNodeRemover(
    node,
    diff,
  )
  const { integrity, resolved } = node

  // skip optional nodes that are deprecated or can't run here
  if (removeOptionalFailedNode && isUnsupported(node)) {
    removeOptionalFailedNode()
    return {
      success: false,
      node,
      error: new Error('Platform check failed or package deprecated'),
    }
  }

  const extractOptions = {
    from,
    integrity,
    resolved,
    fromLockfile: node.resolvedFromLockfile,
  }

  const extracted = (r: ExtractResolution): ExtractResult => {
    // Store computed integrity for git/remote deps
    if (r.integrity && !node.integrity) node.integrity = r.integrity
    // a global store link hands over what reify would read from disk;
    // same result as reading it back, or left for that on failure
    if (r.manifest && !node.manifest) {
      try {
        node.manifest = normalizeManifest(
          asManifest(JSON.parse(r.manifest)),
        )
      } catch {}
    }
    if (r.bindingGyp !== undefined) node.bindingGyp = r.bindingGyp
    return { success: true, node }
  }

  try {
    // nothing to move away on a fresh tree
    if (lstatSync(target, { throwIfNoEntry: false })) {
      await remover.rm(target)
    }

    if (removeOptionalFailedNode) {
      try {
        return extracted(
          await packageInfo.extract(spec, target, extractOptions),
        )
      } catch (error) {
        removeOptionalFailedNode()
        return { success: false, node, error }
      }
    } else {
      return extracted(
        await packageInfo.extract(spec, target, extractOptions),
      )
    }
  } catch (error) {
    /* c8 ignore start */
    if (removeOptionalFailedNode) {
      removeOptionalFailedNode()
      return { success: false, node, error }
    }
    /* c8 ignore stop */
    throw error
  }
}
