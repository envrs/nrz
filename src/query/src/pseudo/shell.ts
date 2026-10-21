import { createSecuritySelectorFilter } from './helpers.js'

/**
 * Filters out any node that does not have a **shellAccess** report alert.
 */
export const shell = createSecuritySelectorFilter(
  'shell',
  'shellAccess',
)
