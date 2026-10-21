import { createSecuritySelectorFilter } from './helpers.js'

/**
 * Filters out any node that does not have a **envVars** report alert.
 */
export const env = createSecuritySelectorFilter('env', 'envVars')
