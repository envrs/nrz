import { asPseudoNode } from '@nrz/dss-parser'
import { queryError } from '../error.js'
import { clear, removeDanglingEdges, removeNode } from './helpers.js'
import type { ParserState } from '../types.js'

/**
 * `:skills`: matches installed packages that ship agent skills, as
 * told by the `hasSkills` provider.
 */
export const skills = async (state: ParserState) => {
  // `:skills(x)`: likely a `:skill(x)` typo
  if (asPseudoNode(state.current).nodes.length) {
    if (state.loose) return clear(state)
    throw queryError(':skills takes no arguments', state.current, {
      wanted: ':skill',
    })
  }
  if (!state.hasSkills) {
    throw queryError(
      'The :skills selector is not supported here',
      state.current,
    )
  }
  for (const node of state.partial.nodes) {
    if (!(await state.hasSkills(node))) removeNode(state, node)
  }
  removeDanglingEdges(state)
  return state
}
