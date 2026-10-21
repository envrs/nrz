import { createSecuritySelectorFilter } from './helpers.js'

/**
 * Filters out any node that does not have a **hasNativeCode** report alert.
 */
export const nativeParser = createSecuritySelectorFilter(
  'native',
  'hasNativeCode',
)
