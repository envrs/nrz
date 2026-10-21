import { PackageJson } from '@nrz/package-json'
import { Spec } from '@nrz/spec'
import type { NormalizedManifest } from '@nrz/types'
import { resolve } from 'node:path'
import type { Test } from 'tap'
import t from 'tap'
import type { NrxManifest, NrxOptions } from '../src/index.ts'
import { mkdirSync, readFileSync } from 'node:fs'

const getNrxInstall = async (
  t: Test,
  {
    // just to verify that install returns whatever nrxInfo reports
    mockNrxInfo = (path: string, options: NrxOptions) => ({
      path,
      options,
    }),
    resolvedIntegrity = 'sha512-AO2ac6pjRB3SJmGJo+v5/aK6Omggp6fsLrs6wN9bd35ulu4cCwaAU9+7ZhXjeqHVkaHThLuzH0nZr0YpCDhygg==',
    installedIntegrity,
  }: {
    mockNrxInfo?: (
      path: string,
      options: NrxOptions,
      manifest?: NormalizedManifest,
    ) => { path: string; options: NrxOptions }
    /** what package-info resolves to before the install; null for none */
    resolvedIntegrity?: string | null
    /** what the install hashed while extracting */
    installedIntegrity?: string
  } = {},
) => {
  const installs: [string, NrxManifest][] = []
  const packageJson = new PackageJson()
  const dir = t.testdir({})

  const mockInstall = async (options: NrxOptions) => {
    const { projectRoot, packageJson } = options
    t.equal(options['stale-while-revalidate-factor'], Infinity)
    installs.push([projectRoot, packageJson.read(projectRoot)])
    return {
      graph: {
        mainImporter: {
          edgesOut: new Map([
            ['abbrev', { to: { integrity: installedIntegrity } }],
          ]),
        },
      },
    }
  }

  class MockPackageInfoClient {
    resolve() {
      return {
        resolved:
          'https://registry.npmjs.org/abbrev/-/abbrev-3.0.1.tgz',
        integrity: resolvedIntegrity ?? undefined,
      }
    }
  }

  class MockXDG {
    path: string
    constructor(path: string) {
      this.path = resolve(dir, path)
    }
    data(path = '') {
      return resolve(this.path, path)
    }
  }

  const { nrxInstall } = await t.mockImport<
    typeof import('../src/install.ts')
  >('../src/install.ts', {
    '@nrz/package-info': {
      PackageInfoClient: MockPackageInfoClient,
    },
    '@nrz/xdg': { XDG: MockXDG },
    '@nrz/graph': { install: mockInstall },
    '../src/info.ts': { nrxInfo: mockNrxInfo },
  })

  return {
    nrxInstall,
    options: {
      packageRoot: t.testdirName,
      packageJson,
    } as unknown as NrxOptions,
    expectedInstallDir: resolve(
      t.testdirName,
      'nrz/nrx/abbrev-c37c2618',
    ),
    installs,
    clearInstalls: () => (installs.length = 0),
  }
}

t.test('need an install, but do not accept prompt', async t => {
  const { nrxInstall, options } = await getNrxInstall(t)

  await t.rejects(
    nrxInstall('abbrev', options, async () => 'no'),
    {
      message: 'Operation aborted',
    },
  )
})

t.test('need an install, accept prompt with --yes', async t => {
  const { nrxInstall, options, expectedInstallDir, installs } =
    await getNrxInstall(t)

  const result = await nrxInstall(
    'abbrev',
    { ...options, yes: true },
    async () => 'no',
  )

  t.match(result, {
    path: expectedInstallDir,
    options: {
      packageRoot: t.testdirName,
      yes: true,
      'stale-while-revalidate-factor': Infinity,
    },
  })
  t.equal(installs[0]?.[0], expectedInstallDir)
  t.equal(installs.length, 1)
  t.strictSame(installs[0]?.[1].dependencies, {
    abbrev: 'https://registry.npmjs.org/abbrev/-/abbrev-3.0.1.tgz',
  })
})

t.test('pins the integrity the install hashed', async t => {
  const integrity = `sha512-${'a'.repeat(86)}==`
  const { nrxInstall, options, expectedInstallDir, installs } =
    await getNrxInstall(t, {
      // an abbreviated packument resolves without one
      resolvedIntegrity: null,
      installedIntegrity: integrity,
    })
  await nrxInstall(
    'abbrev',
    { ...options, yes: true },
    async () => 'no',
  )
  t.equal(
    installs[0]?.[1].nrx?.integrity,
    undefined,
    'none before install',
  )
  const written = JSON.parse(
    readFileSync(resolve(expectedInstallDir, 'package.json'), 'utf8'),
  )
  t.equal(written.nrx.integrity, integrity, 'recorded after install')
})

t.test('need no install, prompt not relevant', async t => {
  const { nrxInstall, options, expectedInstallDir, clearInstalls } =
    await getNrxInstall(t)

  await nrxInstall(
    'abbrev',
    { ...options, yes: true },
    async () => 'no',
  )
  clearInstalls()

  const result = await nrxInstall(
    Spec.parseArgs('abbrev'),
    options,
    async () => 'no',
  )

  t.match(result, {
    path: expectedInstallDir,
    options: {
      packageRoot: t.testdirName,
      'stale-while-revalidate-factor': Infinity,
    },
  })
})

t.test('retries if nrx info fails', async t => {
  const { nrxInstall, options, expectedInstallDir, installs } =
    await getNrxInstall(t, {
      mockNrxInfo: (path, options, manifest) => {
        if (manifest) {
          return { path, options }
        }
        throw new Error('Initial nrx info failed')
      },
    })

  mkdirSync(expectedInstallDir, { recursive: true })

  const result = await nrxInstall('abbrev', { ...options, yes: true })

  t.match(result, {
    path: expectedInstallDir,
    options: {
      packageRoot: t.testdirName,
      yes: true,
      'stale-while-revalidate-factor': Infinity,
    },
  })
  t.equal(installs[0]?.[0], expectedInstallDir)
  t.equal(installs.length, 1)
  t.strictSame(installs[0]?.[1].dependencies, {
    abbrev: 'https://registry.npmjs.org/abbrev/-/abbrev-3.0.1.tgz',
  })
})
