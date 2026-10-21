import { createSecuritySelectorFilter } from './helpers.js'

/**
 * Filters out any node that does not have a **usesEval** report alert.
 */
export const evalParser = createSecuritySelectorFilter(
  'eval',
  'usesEval',
)
