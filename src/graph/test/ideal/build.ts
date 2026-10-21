import { joinDepIDTuple } from '@nrz/dep-id'
import type { PackageInfoClient } from '@nrz/package-info'
import { PackageJson } from '@nrz/package-json'
import { RollbackRemove } from '@nrz/rollback-remove'
import { getOptions, Spec } from '@nrz/spec'
import { Monorepo } from '@nrz/workspaces'
import { PathScurry } from 'path-scurry'
import t from 'tap'
import { asDependency } from '../../src/dependencies.js'
import { build } from '../../src/ideal/build.js'
import { objectLikeOutput } from '../../src/visualization/object-like-output.js'
import type { DepIDTuple } from '@nrz/dep-id'
import type { Manifest } from '@nrz/types'
import type { LockfileEdgeKey } from '../../src/index.js'
import type {
  AddImportersDependenciesMap,
  RemoveImportersDependenciesMap,
} from '../../src/dependencies.js'

const edgeKey = (from: DepIDTuple, to: string): LockfileEdgeKey =>
  `${joinDepIDTuple(from)} ${to}`

const specOptions = getOptions({})

const packageInfo = {
  async manifest(spec: Spec) {
    switch (spec.name) {
      case 'foo':
        return {
          name: 'foo',
          version: '1.0.0',
          dist: {
            integrity:
              'sha512-URO90jLnKPqX+P7OLnJkiIQfMX4I6gEdGZ1T84drQLtRPw6uNKYLZfB6K3hjWIrj0VZB1kh2cTFdeq01i6XIYQ==',
          } as Manifest,
        }
      default:
        throw new Error('404 - ' + spec.name, { cause: { spec } })
    }
  },
} as PackageInfoClient

t.test('build from lockfile', async t => {
  const projectRoot = t.testdir({
    'package.json': JSON.stringify({
      name: 'my-project',
      version: '1.0.0',
      dependencies: {
        foo: '^1.0.0',
      },
    }),
    'nrz-lock.json': JSON.stringify({
      options: {},
      nodes: {
        [joinDepIDTuple(['registry', '', 'foo@1.0.0'])]: [
          0,
          'foo',
          'sha512-URO90jLnKPqX+P7OLnJkiIQfMX4I6gEdGZ1T84drQLtRPw6uNKYLZfB6K3hjWIrj0VZB1kh2cTFdeq01i6XIYQ==',
        ],
      },
      edges: {
        [edgeKey(['file', '.'], 'foo')]:
          'prod ^1.0.0 ' +
          joinDepIDTuple(['registry', '', 'foo@1.0.0']),
      },
    }),
  })

  const graph = await build({
    ...specOptions,
    scurry: new PathScurry(projectRoot),
    monorepo: Monorepo.maybeLoad(projectRoot),
    packageJson: new PackageJson(),
    packageInfo,
    projectRoot,
    add: new Map([
      [joinDepIDTuple(['file', '.']), new Map()],
    ]) as AddImportersDependenciesMap,
    remove: new Map() as RemoveImportersDependenciesMap,
    remover: new RollbackRemove(),
  })

  t.matchSnapshot(
    objectLikeOutput(graph),
    'should build an ideal tree starting from a virtual graph',
  )
})

t.test('build from actual files', async t => {
  const projectRoot = t.testdir({
    'package.json': JSON.stringify({
      name: 'my-project',
      version: '1.0.0',
      dependencies: {
        foo: '^1.0.0',
      },
    }),
    node_modules: {
      '.nrz': {
        [joinDepIDTuple(['registry', '', 'foo@1.0.0'])]: {
          node_modules: {
            foo: {
              'package.json': JSON.stringify({
                name: 'foo',
                version: '1.0.0',
              }),
            },
          },
        },
      },
      foo: t.fixture(
        'symlink',
        '.nrz/' +
          joinDepIDTuple(['registry', '', 'foo@1.0.0']) +
          '/node_modules/foo',
      ),
    },
  })

  const graph = await build({
    ...specOptions,
    scurry: new PathScurry(projectRoot),
    monorepo: Monorepo.maybeLoad(projectRoot),
    packageJson: new PackageJson(),
    packageInfo,
    projectRoot,
    remover: new RollbackRemove(),
  })

  t.matchSnapshot(
    objectLikeOutput(graph),
    'should build an ideal tree starting from a virtual graph',
  )
})

t.test('add with file DepID not in graph throws', async t => {
  const projectRoot = t.testdir({
    'package.json': JSON.stringify({
      name: 'my-project',
      version: '1.0.0',
    }),
    'nrz-lock.json': JSON.stringify({
      options: {},
      nodes: {},
      edges: {},
    }),
  })

  await t.rejects(
    build({
      ...specOptions,
      scurry: new PathScurry(projectRoot),
      monorepo: Monorepo.maybeLoad(projectRoot),
      packageJson: new PackageJson(),
      packageInfo,
      projectRoot,
      add: new Map([
        [
          joinDepIDTuple(['file', 'packages/unknown']),
          new Map([
            [
              'foo',
              asDependency({
                spec: Spec.parse('foo@^1.0.0'),
                type: 'prod',
              }),
            ],
          ]),
        ],
      ]) as AddImportersDependenciesMap,
      remove: new Map() as RemoveImportersDependenciesMap,
      remover: new RollbackRemove(),
    }),
    {
      message:
        'The current working dir is not a dependency of this project',
    },
  )
})

t.test('remove with file DepID not in graph throws', async t => {
  const projectRoot = t.testdir({
    'package.json': JSON.stringify({
      name: 'my-project',
      version: '1.0.0',
    }),
    'nrz-lock.json': JSON.stringify({
      options: {},
      nodes: {},
      edges: {},
    }),
  })

  await t.rejects(
    build({
      ...specOptions,
      scurry: new PathScurry(projectRoot),
      monorepo: Monorepo.maybeLoad(projectRoot),
      packageJson: new PackageJson(),
      packageInfo,
      projectRoot,
      add: new Map() as AddImportersDependenciesMap,
      remove: new Map([
        [
          joinDepIDTuple(['file', 'packages/unknown']),
          new Set(['foo']),
        ],
      ]) as RemoveImportersDependenciesMap,
      remover: new RollbackRemove(),
    }),
    {
      message:
        'The current working dir is not a dependency of this project',
    },
  )
})

t.test(
  'aliased and non-aliased npm deps resolve to same node',
  async t => {
    const projectRoot = t.testdir({
      'package.json': JSON.stringify({
        name: 'my-project',
        version: '1.0.0',
        dependencies: {
          foo: '^1.0.0',
          bar: 'npm:foo@^1.0.0',
        },
      }),
    })

    // Use final.name to resolve aliased specs correctly
    const aliasAwarePackageInfo = {
      async manifest(spec: Spec) {
        switch (spec.final.name) {
          case 'foo':
            return {
              name: 'foo',
              version: '1.0.0',
              dist: {
                integrity:
                  'sha512-URO90jLnKPqX+P7OLnJkiIQfMX4I6gEdGZ1T84drQLtRPw6uNKYLZfB6K3hjWIrj0VZB1kh2cTFdeq01i6XIYQ==',
              } as Manifest,
            }
          default:
            throw new Error('404 - ' + spec.final.name, {
              cause: { spec },
            })
        }
      },
    } as PackageInfoClient

    const graph = await build({
      ...specOptions,
      // the `npm` alias is no longer built in; configure it so the
      // `npm:foo` alias resolves
      registries: {
        ...specOptions.registries,
        npm: 'https://registry.npmjs.org/',
      },
      scurry: new PathScurry(projectRoot),
      monorepo: Monorepo.maybeLoad(projectRoot),
      packageJson: new PackageJson(),
      packageInfo: aliasAwarePackageInfo,
      projectRoot,
      remover: new RollbackRemove(),
    })

    // Both foo and bar should resolve to the same DepID node
    const fooEdge = graph.mainImporter.edgesOut.get('foo')
    const barEdge = graph.mainImporter.edgesOut.get('bar')

    t.ok(fooEdge?.to, 'foo edge should have a target node')
    t.ok(barEdge?.to, 'bar edge should have a target node')
    t.equal(
      fooEdge?.to?.id,
      barEdge?.to?.id,
      'both deps should resolve to the same node (same DepID)',
    )
    t.equal(
      graph.nodes.size,
      2,
      'graph should have exactly 2 nodes (root + foo)',
    )
  },
)

t.test('lockfile version handling', async t => {
  const { LOCKFILE_VERSION } = await t.mockImport<
    typeof import('../../src/lockfile/types.ts')
  >('../../src/lockfile/types.ts')

  t.test('newer lockfile version throws error', async t => {
    const projectRoot = t.testdir({
      'package.json': JSON.stringify({
        name: 'my-project',
        version: '1.0.0',
        dependencies: {
          foo: '^1.0.0',
        },
      }),
      'nrz-lock.json': JSON.stringify({
        lockfileVersion: LOCKFILE_VERSION + 1,
        options: {},
        nodes: {},
        edges: {},
      }),
    })

    await t.rejects(
      build({
        ...specOptions,
        scurry: new PathScurry(projectRoot),
        monorepo: Monorepo.maybeLoad(projectRoot),
        packageJson: new PackageJson(),
        packageInfo,
        projectRoot,
        remover: new RollbackRemove(),
      }),
      {
        message: 'Unsupported lockfile version',
        cause: {
          code: 'ELOCKFILEVERSION',
          found: LOCKFILE_VERSION + 1,
          wanted: LOCKFILE_VERSION,
        },
      },
      'newer lockfile version should throw',
    )
  })

  t.test('older lockfile version throws', async t => {
    const projectRoot = t.testdir({
      'package.json': JSON.stringify({
        name: 'my-project',
        version: '1.0.0',
        dependencies: {
          foo: '^1.0.0',
        },
      }),
      'nrz-lock.json': JSON.stringify({
        lockfileVersion: LOCKFILE_VERSION - 1,
        options: {},
        nodes: {},
        edges: {},
      }),
      node_modules: {
        foo: {
          'package.json': JSON.stringify({
            name: 'foo',
            version: '1.0.0',
          }),
        },
        '.nrz': {
          'nrz.json': JSON.stringify({}),
        },
      },
    })

    await t.rejects(
      build({
        ...specOptions,
        scurry: new PathScurry(projectRoot),
        monorepo: Monorepo.maybeLoad(projectRoot),
        packageJson: new PackageJson(),
        packageInfo,
        projectRoot,
        remover: new RollbackRemove(),
      }),
      {
        message: 'Unsupported lockfile version',
        cause: {
          code: 'ELOCKFILEVERSION',
          found: LOCKFILE_VERSION - 1,
          wanted: LOCKFILE_VERSION,
        },
      },
      'newer lockfile version should throw',
    )
  })
})

t.test('broken lockfile fails loud, does not rebuild', async t => {
  const { LOCKFILE_VERSION } = await t.mockImport<
    typeof import('../../src/lockfile/types.ts')
  >('../../src/lockfile/types.ts')
  const projectRoot = t.testdir({
    'package.json': JSON.stringify({
      name: 'my-project',
      version: '1.0.0',
      dependencies: { foo: '^1.0.0' },
    }),
    'nrz-lock.json': JSON.stringify({
      lockfileVersion: LOCKFILE_VERSION,
      options: {},
      nodes: {
        [`file~../../../tmp/forbidden`]: [0, 'forbidden'],
      },
      edges: {},
    }),
  })

  await t.rejects(
    build({
      ...specOptions,
      scurry: new PathScurry(projectRoot),
      monorepo: Monorepo.maybeLoad(projectRoot),
      packageJson: new PackageJson(),
      packageInfo,
      projectRoot,
      remover: new RollbackRemove(),
    }),
    { cause: { code: 'EINVALIDNAME' } },
    'does not silently fall back to loading the actual tree',
  )
})

t.test(
  'releases the server resolve once the ideal graph is built',
  async t => {
    const calls: string[] = []
    const resolving = {
      manifest: (spec: Spec) => packageInfo.manifest(spec),
      prefetchResolve: () => {
        calls.push('prefetch')
        return () => calls.push('release')
      },
    } as unknown as PackageInfoClient
    const options = {
      ...specOptions,
      registry: 'https://registry.npmjs.org/',
      registries: {
        ...specOptions.registries,
        npm: 'https://registry.npmjs.org/',
      },
      packageJson: new PackageJson(),
      packageInfo: resolving,
      remove: new Map() as RemoveImportersDependenciesMap,
      remover: new RollbackRemove(),
    }
    const project = (dependencies: Record<string, string>) => {
      const projectRoot = t.testdir({
        'package.json': JSON.stringify({
          name: 'my-project',
          version: '1.0.0',
          dependencies,
        }),
      })
      return {
        ...options,
        projectRoot,
        scurry: new PathScurry(projectRoot),
        monorepo: Monorepo.maybeLoad(projectRoot),
        add: new Map([
          [joinDepIDTuple(['file', '.']), new Map()],
        ]) as AddImportersDependenciesMap,
      }
    }

    await build(project({ foo: '^1.0.0' }))
    t.strictSame(
      calls,
      ['prefetch', 'release'],
      'released after the build',
    )
  },
)
