import { getTokenByURL, registryKeys } from '@nrz/registry-client'
import type { GetAuthHeader } from '@nrz/query'
import type { LoadedConfig } from './config/index.js'

/**
 * Returns a {@link GetAuthHeader} implementation that looks up
 * authorization tokens from the local keychain / env (incl.
 * `NRZ_TOKEN_<key>` for configured registries), used by
 * network-reliant query selectors, e.g: `:outdated()`.
 */
export const createGetAuthHeader = (
  conf: LoadedConfig,
): GetAuthHeader => {
  const keys = registryKeys(conf.options)
  return async url => getTokenByURL(url, conf.options.identity, keys)
}
