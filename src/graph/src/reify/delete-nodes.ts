import type { RollbackRemove } from '@nrz/rollback-remove'
import type { PathScurry } from 'path-scurry'
import type { Diff } from '../diff.js'
import { deleteEdge } from './delete-edge.js'

export const deleteNodes = (
  diff: Diff,
  remover: RollbackRemove,
  scurry: PathScurry,
): Promise<unknown>[] => {
  const store = scurry.resolve('node_modules/.nrz')
  const { sep } = scurry.cwd
  const rmActions: Promise<unknown>[] = []
  for (const node of diff.nodes.delete) {
    // do not delete workspaces or link targets
    if (!node.inNrzStore()) continue
    rmActions.push(remover.rm(store + sep + node.id))
    for (const edge of node.edgesIn) {
      rmActions.push(deleteEdge(edge, scurry, remover))
    }
  }
  return rmActions
}
