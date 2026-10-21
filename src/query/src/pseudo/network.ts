import { createSecuritySelectorFilter } from './helpers.js'

/**
 * Filters out any node that does not have a **networkAccess** report alert.
 */
export const network = createSecuritySelectorFilter(
  'network',
  'networkAccess',
)
