import { cmdShim } from '@nrz/cmd-shim'
import { error } from '@nrz/error-cause'
import type { PackageJson } from '@nrz/package-json'
import { RollbackRemove } from '@nrz/rollback-remove'
import type { Spec } from '@nrz/spec'
import { XDG } from '@nrz/xdg'
import { createHash } from 'node:crypto'
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
} from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { dirExists } from './dir-exists.js'
import type { NrxInfo } from './index.js'
import { inferDefaultExecutable } from './infer-default-executable.js'

/**
 * Absolute path if the spec is a local directory (relative to cwd)
 */
export const localDir = async (
  spec: Spec,
): Promise<string | undefined> => {
  const { type, file } = spec.final
  if (type !== 'file' || !file) return
  const dir = resolve(file)
  return (await dirExists(dir)) ? dir : undefined
}

/**
 * Shim a local directory's bins into a private bin dir, so they run
 * in place. Nothing is installed.
 *
 * The dir is keyed by all the shims depend on (dir, bins, shebangs),
 * and never changed once made, so concurrent runs are safe.
 */
export const nrxLocal = async (
  dir: string,
  packageJson: PackageJson,
): Promise<NrxInfo> => {
  const manifest = packageJson.read(dir)
  const bins = Object.entries(manifest.bin ?? {})
  const heads = await Promise.all(
    bins.map(async ([k, v]) => {
      const target = resolve(dir, v)
      const data = await readFile(target, 'utf8').catch(
        (cause: unknown) => {
          throw error(`Bin target not found: ${k} -> ${v}`, {
            path: target,
            cause,
          })
        },
      )
      return `\0${k}\0${v}\0${data.trim().split(/\r*\n/)[0]}`
    }),
  )
  const key = createHash('sha512')
    .update(dir + heads.join(''))
    .digest('hex')
    .substring(0, 16)
  const cache = new XDG('nrz/nrx-local').cache()
  await mkdir(cache, { recursive: true })
  // real path, so the shims' relative `..` resolve as expected
  const path = resolve(await realpath(cache), key)
  if (!(await dirExists(path))) {
    // build aside, then move into place
    const tmp = await mkdtemp(`${path}-`)
    const remover = new RollbackRemove()
    await Promise.all(
      bins.map(([k, v]) =>
        cmdShim(
          resolve(dir, v),
          resolve(tmp, 'node_modules/.bin', k),
          remover,
        ),
      ),
    )
    remover.confirm()
    await rename(tmp, path).catch(async (er: unknown) => {
      // another run made it first
      if (!(await dirExists(path))) throw er
      await rm(tmp, { recursive: true, force: true })
    })
  }
  return {
    path,
    name: manifest.name ?? basename(dir),
    version: manifest.version,
    resolved: String(pathToFileURL(dir)),
    arg0: inferDefaultExecutable(manifest)?.[0],
  }
}
