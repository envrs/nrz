import { createSecuritySelectorFilter } from './helpers.js'

/**
 * Filters out any node that does not have a **deprecated** report alert.
 */
export const deprecated = createSecuritySelectorFilter(
  'deprecated',
  'deprecated',
)
