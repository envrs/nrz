import { resolve } from 'node:path'
import t from 'tap'
import { storeRoot } from '../src/store-root.js'

t.equal(storeRoot('/c'), resolve('/c/store/v1'))
