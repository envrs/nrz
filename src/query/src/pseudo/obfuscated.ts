import { createSecuritySelectorFilter } from './helpers.js'

/**
 * Filters out any node that does not have an **obfuscatedFile** report alert.
 */
export const obfuscated = createSecuritySelectorFilter(
  'obfuscated',
  'obfuscatedFile',
)
