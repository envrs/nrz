import t from 'tap'

import { nrxDelete } from '../src/delete.js'
import * as nrx from '../src/index.js'
import { nrxInfo } from '../src/info.js'
import { nrxInstall } from '../src/install.js'
import { nrxList } from '../src/list.js'
import { nrxResolve } from '../src/resolve.js'

import type { PromptFn, NrxInfo, NrxOptions } from '../src/index.js'

const typeChecks = () => {
  //@ts-expect-error
  const x: NrxOptions = undefined
  //@ts-expect-error
  const z: NrxInfo = undefined
  //@ts-expect-error
  const y: PromptFn = () => {}
  x
  y
  z
}
typeChecks

t.strictSame(
  nrx,
  Object.assign(Object.create(null), {
    info: nrxInfo,
    install: nrxInstall,
    resolve: nrxResolve,
    list: nrxList,
    delete: nrxDelete,
  }),
)
