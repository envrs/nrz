import { splitDepID } from '@nrz/dep-id/browser'
import { asPostcssNodeWithChildren, asTagNode } from '@nrz/dss-parser'
import { removeDanglingEdges, removeNode } from './helpers.js'
import type { ParserState } from '../types.js'

/**
 * :registry(name) Pseudo-Selector, matches only nodes that
 * belong to the specified registry configuration alias.
 *
 * For example, `:registry(npm)` matches deps from the default
 * npm registry, and `:registry(custom)` matches deps from a
 * custom-named registry.
 */
export const registry = async (state: ParserState) => {
  const top = asPostcssNodeWithChildren(state.current)
  const selector = asPostcssNodeWithChildren(top.nodes[0])
  const name = asTagNode(selector.nodes[0]).value
  for (const node of state.partial.nodes) {
    const tuple = splitDepID(node.id)
    if (tuple[0] !== 'registry' || tuple[1] !== name) {
      removeNode(state, node)
    }
  }
  removeDanglingEdges(state)
  return state
}
