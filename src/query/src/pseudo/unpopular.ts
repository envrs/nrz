import { createSecuritySelectorFilter } from './helpers.js'

/**
 * Filters out any node that does not have a **unpopularPackage** report alert.
 */
export const unpopular = createSecuritySelectorFilter(
  'unpopular',
  'unpopularPackage',
)
