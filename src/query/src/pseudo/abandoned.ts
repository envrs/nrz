import { createSecuritySelectorFilter } from './helpers.js'

/**
 * Filters out any node that does not have a **missingAuthor** report alert.
 */
export const abandoned = createSecuritySelectorFilter(
  'abandoned',
  'missingAuthor',
)
