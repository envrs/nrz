import type { RollbackRemove } from '@nrz/rollback-remove'
import type { PathScurry } from 'path-scurry'
import type { Diff } from '../diff.js'
import { addEdge } from './add-edge.js'

export const addEdges = (
  diff: Diff,
  scurry: PathScurry,
  remover: RollbackRemove,
): (() => Promise<unknown>)[] => {
  const actions: (() => Promise<unknown>)[] = []
  for (const edge of diff.edges.add) {
    const { to } = edge
    if (!to) continue
    const bins = to.bins
    actions.push(() => addEdge(edge, scurry, remover, bins))
  }
  return actions
}
