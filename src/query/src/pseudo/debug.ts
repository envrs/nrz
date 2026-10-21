import { createSecuritySelectorFilter } from './helpers.js'

/**
 * Filters out any node that does not have a **debugAccess** report alert.
 */
export const debug = createSecuritySelectorFilter(
  'debug',
  'debugAccess',
)
