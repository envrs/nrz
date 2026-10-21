import type { ParsedConfig } from './config/index.js'

type NrzJsonModule = {
  unload: (which?: 'user' | 'project') => void
}

export const reloadConfig = async (
  folder: string,
): Promise<ParsedConfig> => {
  try {
    const { unload } =
      (await import('@nrz/nrz-json')) as NrzJsonModule
    unload('user')
    unload('project')
    /* c8 ignore next */
  } catch {}

  const { Config } = await import('./config/index.ts')
  return Config.load(folder, process.argv, true)
}
