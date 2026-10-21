import { createSecuritySelectorFilter } from './helpers.js'

/**
 * Filters out any node that does not have a **unmaintained** report alert.
 */
export const unmaintained = createSecuritySelectorFilter(
  'unmaintained',
  'unmaintained',
)
