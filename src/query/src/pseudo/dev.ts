import type { ParserState } from '../types.js'
import { removeEdge, removeUnlinkedNodes } from './helpers.js'

/**
 * :dev Pseudo-Selector will only match devDependencies.
 */
export const dev = async (state: ParserState) => {
  // filter edges that don't have type 'dev'
  for (const edge of state.partial.edges) {
    if (edge.type !== 'dev') {
      removeEdge(state, edge)
    }
  }

  removeUnlinkedNodes(state)

  return state
}
