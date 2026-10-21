import type { ParserState } from '../types.js'
import { removeEdge, removeUnlinkedNodes } from './helpers.js'

/**
 * :prod Pseudo-Selector will only match production dependencies.
 */
export const prod = async (state: ParserState) => {
  // filter edges that don't have type 'prod'
  for (const edge of state.partial.edges) {
    if (edge.type !== 'prod') {
      removeEdge(state, edge)
    }
  }

  removeUnlinkedNodes(state)

  return state
}
