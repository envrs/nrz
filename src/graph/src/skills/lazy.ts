import type { HasSkills } from '@nrz/query'
import { isNode } from '../node.js'
import type * as Skills from './index.js'

const load = () => import('./index.ts')

/** `listSkills`, loading the skills code on first use. */
export const listSkills: typeof Skills.listSkills = async o =>
  (await load()).listSkills(o)

/** `linkSkills`, loading the skills code on first use. */
export const linkSkills: typeof Skills.linkSkills = async o =>
  (await load()).linkSkills(o)

/** `:skills` provider: loads the skills code on first `Node`. */
export const hasSkills: HasSkills = async node =>
  isNode(node) && (await load()).shipsSkills(node)
