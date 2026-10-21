import { longDependencyTypes } from '@nrz/types'
import { asDependencyTypeShort, shorten } from './dependencies.js'
import { getBooleanFlagsFromNum } from './lockfile/types.js'
import { stringifyNode } from './stringify-node.js'
import { loadEdges } from './lockfile/load-edges.js'
import { loadNodes } from './lockfile/load-nodes.js'
import { load } from './transfer-data/load.js'
export type {
  LoadResult,
  TransferData,
} from './transfer-data/load.js'

export * from './virtual-root.js'

const lockfile = {
  loadEdges,
  loadNodes,
}

const transfer = {
  load,
}

export {
  asDependencyTypeShort,
  getBooleanFlagsFromNum,
  lockfile,
  longDependencyTypes,
  shorten,
  stringifyNode,
  transfer,
}
