import { resolve } from 'node:path'
import t from 'tap'
import {
  assertNrzInstalled,
  isNrzInstalled,
} from '../src/is-nrz-installed.js'

t.test('isNrzInstalled', async t => {
  t.equal(
    isNrzInstalled(t.testdir({ node_modules: { '.nrz': {} } })),
    true,
    'store dir marks a nrz install',
  )
  t.equal(
    isNrzInstalled(
      t.testdir({ node_modules: { '.nrz-lock.json': '{}' } }),
    ),
    true,
    'hidden lockfile marks a dependency-less nrz install',
  )
  t.equal(
    isNrzInstalled(t.testdir({ node_modules: { '.nrz': 'file' } })),
    false,
    'store must be a directory',
  )
  t.equal(
    isNrzInstalled(t.testdir({ node_modules: { foo: {} } })),
    false,
    'foreign node_modules is not a nrz install',
  )
  t.equal(isNrzInstalled(t.testdir({})), false, 'no node_modules')
  t.equal(
    isNrzInstalled(t.testdir({ node_modules: 'file' })),
    false,
    'node_modules that is a file is not a nrz install',
  )
})

t.test('lstat errors other than ENOENT', async t => {
  const dir = t.testdir({ node_modules: { '.nrz': {} } })
  const { isNrzInstalled, assertNrzInstalled } = await t.mockImport<
    typeof import('../src/is-nrz-installed.ts')
  >('../src/is-nrz-installed.ts', {
    'node:fs': {
      lstatSync: (path: string) => {
        throw Object.assign(new Error('permission denied'), {
          code: 'EACCES',
          path,
        })
      },
    },
  })
  t.equal(
    isNrzInstalled(dir),
    false,
    'unreadable node_modules is not a nrz install',
  )
  t.throws(
    () => assertNrzInstalled(dir, 'query'),
    {
      message: `No nrz install found in ${resolve(dir, 'node_modules')}\n\n  run \`nrz install\` before running \`nrz query\``,
      cause: { code: 'EQUERY', path: resolve(dir, 'node_modules') },
    },
    'should raise the usage error instead of the fs error',
  )
})

t.test('assertNrzInstalled', async t => {
  t.doesNotThrow(() =>
    assertNrzInstalled(
      t.testdir({ node_modules: { '.nrz': {} } }),
      'query',
    ),
  )

  const foreign = t.testdir({ node_modules: { foo: {} } })
  t.throws(() => assertNrzInstalled(foreign, 'query'), {
    message: `No nrz install found in ${resolve(foreign, 'node_modules')}\n\n  run \`nrz install\` to rebuild it before running \`nrz query\``,
    cause: { code: 'EQUERY', path: resolve(foreign, 'node_modules') },
  })

  const nmFile = t.testdir({ node_modules: 'file' })
  t.throws(() => assertNrzInstalled(nmFile, 'query'), {
    message: `No nrz install found in ${resolve(nmFile, 'node_modules')}\n\n  run \`nrz install\` before running \`nrz query\``,
    cause: { code: 'EQUERY', path: resolve(nmFile, 'node_modules') },
  })

  const empty = t.testdir({})
  t.throws(() => assertNrzInstalled(empty, 'ls'), {
    message: `No nrz install found in ${resolve(empty, 'node_modules')}\n\n  run \`nrz install\` before running \`nrz ls\``,
    cause: { code: 'EQUERY', path: resolve(empty, 'node_modules') },
  })
})
