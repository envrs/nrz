import t from 'tap'
import * as unpack from '../src/unpack.js'
import * as clonefile from '../src/clonefile.js'
import * as linkTree from '../src/link-tree.js'
import * as pool from '../src/pool.js'
import * as storeEntry from '../src/store-entry.js'
import * as storeIndex from '../src/store-index.js'
import * as index from '../src/index.js'

t.strictSame(
  index,
  Object.assign(Object.create(null), {
    unpack: unpack.unpack,
    unpackToStoreSync: unpack.unpackToStoreSync,
    cloneAvailable: clonefile.cloneAvailable,
    ...linkTree,
    ...pool,
    ...storeEntry,
    readStoreIndex: storeIndex.readStoreIndex,
    storeIndexPath: storeIndex.storeIndexPath,
  }),
)
