import { createSecuritySelectorFilter } from './helpers.js'

/**
 * Filters out any node that does not have a **suspiciousStarActivity** report alert.
 */
export const suspicious = createSecuritySelectorFilter(
  'suspicious',
  'suspiciousStarActivity',
)
