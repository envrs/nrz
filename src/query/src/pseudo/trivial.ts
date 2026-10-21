import { createSecuritySelectorFilter } from './helpers.js'

/**
 * Filters out any node that does not have a **trivialPackage** report alert.
 */
export const trivial = createSecuritySelectorFilter(
  'trivial',
  'trivialPackage',
)
