import { removeDanglingEdges, removeNode } from './helpers.js'
import type { ParserState } from '../types.js'

/**
 * :scanned pseudo selector.
 *
 * Remove all nodes that do not have available metadata
 * in the security archive.
 */
export const scanned = async (state: ParserState) => {
  for (const node of state.partial.nodes) {
    if (!state.securityArchive?.has(node.id)) {
      removeNode(state, node)
    }
  }

  removeDanglingEdges(state)

  return state
}
