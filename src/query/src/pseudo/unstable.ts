import { createSecuritySelectorFilter } from './helpers.js'

/**
 * Filters out any node that does not have a **unstableOwnership** report alert.
 */
export const unstable = createSecuritySelectorFilter(
  'unstable',
  'unstableOwnership',
)
