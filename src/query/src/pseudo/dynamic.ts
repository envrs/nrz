import { createSecuritySelectorFilter } from './helpers.js'

/**
 * Filters out any node that does not have a **dynamicRequire** report alert.
 */
export const dynamic = createSecuritySelectorFilter(
  'dynamic',
  'dynamicRequire',
)
