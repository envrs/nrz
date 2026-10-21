import t from 'tap'
import {
  isToken,
  normalizeRegistryKey,
  registryBase,
} from '../src/auth.ts'

const checkLog = (kc: any) => (kc as Keychain).log

let expectKeychainApp = 'nrz/auth'
class Keychain {
  log: string[][] = []
  file: string
  #data: Record<string, string> = {}

  constructor(app: string) {
    t.equal(app, expectKeychainApp)
    this.file = app + '/keychain.json'
  }

  async load() {
    this.log.push(['load'])
  }

  async save() {
    this.log.push(['save'])
  }

  async delete(reg: string) {
    this.log.push(['delete', reg])
    delete this.#data[reg]
  }

  async set(reg: string, token: string) {
    t.equal(isToken(token), true)
    this.log.push(['set', reg, token])
    this.#data[reg] = token
  }

  async get(reg: string) {
    this.log.push(['get', reg])
    return this.#data[reg] as `Bearer ${string}` | undefined
  }

  getSync(reg: string) {
    return this.#data[reg]
  }

  async keys() {
    return Object.keys(this.#data)
  }

  keysSync() {
    return Object.keys(this.#data)
  }
}

const mocks = { '@nrz/keychain': { Keychain } }

t.test('normalizeRegistryKey', t => {
  // Origin-only URLs (backward compat)
  t.equal(
    normalizeRegistryKey('https://registry.npmjs.org/'),
    'https://registry.npmjs.org',
  )
  t.equal(
    normalizeRegistryKey('https://registry.npmjs.org'),
    'https://registry.npmjs.org',
  )
  // Path-scoped registries
  t.equal(
    normalizeRegistryKey('https://registry.nrz.khulnasoft.com/luke/'),
    'https://registry.nrz.khulnasoft.com/luke',
  )
  t.equal(
    normalizeRegistryKey('https://registry.nrz.khulnasoft.com/luke'),
    'https://registry.nrz.khulnasoft.com/luke',
  )
  // Multiple trailing slashes
  t.equal(
    normalizeRegistryKey('https://r.io/path///'),
    'https://r.io/path',
  )
  // Port preserved
  t.equal(
    normalizeRegistryKey('https://foo.com:8080/'),
    'https://foo.com:8080',
  )
  // Throws on invalid URL
  t.throws(() => normalizeRegistryKey('not a url'))
  t.end()
})

t.test('registryBase', t => {
  t.equal(
    registryBase('https://registry.npmjs.org'),
    'https://registry.npmjs.org/',
  )
  t.equal(
    registryBase('https://registry.npmjs.org/'),
    'https://registry.npmjs.org/',
  )
  t.equal(
    registryBase('https://registry.nrz.khulnasoft.com/nrz/main'),
    'https://registry.nrz.khulnasoft.com/nrz/main/',
  )
  t.equal(
    registryBase('https://registry.nrz.khulnasoft.com/nrz/main/'),
    'https://registry.nrz.khulnasoft.com/nrz/main/',
  )
  t.end()
})

t.test('isToken', t => {
  t.equal(isToken('Bearer ok'), true)
  t.equal(isToken('Basic ok'), true)
  t.equal(isToken('foobar not ok'), false)
  t.equal(isToken('bearer not ok'), false)
  t.equal(isToken('basic not ok'), false)
  t.end()
})

t.test('setToken', async t => {
  const { setToken, getKC } = await t.mockImport<
    typeof import('../src/auth.ts')
  >('../src/auth.ts', mocks)
  await t.rejects(setToken('not a url', 'Bearer token', ''))
  await setToken('https://x.com/', 'Bearer token', '')
  t.strictSame(checkLog(getKC('')), [
    ['load'],
    ['load'],
    ['set', 'https://x.com', 'Bearer token'],
    ['save'],
  ])
  function typeChecks() {
    //@ts-expect-error
    void setToken('https://url/', 'not a token')
  }
  typeChecks
})

t.test('setToken preserves path', async t => {
  const { setToken, getKC } = await t.mockImport<
    typeof import('../src/auth.ts')
  >('../src/auth.ts', mocks)
  await setToken(
    'https://registry.nrz.khulnasoft.com/luke/',
    'Bearer luketoken',
    '',
  )
  t.strictSame(checkLog(getKC('')), [
    ['load'],
    [
      'set',
      'https://registry.nrz.khulnasoft.com/luke',
      'Bearer luketoken',
    ],
    ['save'],
  ])
})

t.test('deleteToken', async t => {
  const { deleteToken, getKC } = await t.mockImport<
    typeof import('../src/auth.ts')
  >('../src/auth.ts', mocks)
  await t.rejects(deleteToken('not a url', ''))
  await deleteToken('https://x.com/', '')
  t.strictSame(checkLog(getKC('')), [
    ['load'],
    ['load'],
    ['delete', 'https://x.com'],
    ['save'],
  ])
})

t.test('deleteToken preserves path', async t => {
  const { deleteToken, getKC } = await t.mockImport<
    typeof import('../src/auth.ts')
  >('../src/auth.ts', mocks)
  await deleteToken('https://registry.nrz.khulnasoft.com/luke/', '')
  t.strictSame(checkLog(getKC('')), [
    ['load'],
    ['delete', 'https://registry.nrz.khulnasoft.com/luke'],
    ['save'],
  ])
})

t.test('deleteToken drops every key holding the token', async t => {
  const { deleteToken, getKC } = await t.mockImport<
    typeof import('../src/auth.ts')
  >('../src/auth.ts', mocks)
  const kc = getKC('')
  kc.set('https://r.io/acme/npm', 'Bearer tok')
  kc.set('https://r.io/acme/main', 'Bearer tok')
  kc.set('https://r.io/other', 'Bearer other')
  await deleteToken('https://r.io/acme/npm/', '', 'Bearer tok')
  t.strictSame(await kc.keys(), ['https://r.io/other'])
  t.strictSame(checkLog(kc).slice(3), [
    ['load'],
    ['delete', 'https://r.io/acme/npm'],
    ['delete', 'https://r.io/acme/main'],
    ['save'],
  ])
})

t.test('getToken', async t => {
  const { getToken, getKC } = await t.mockImport<
    typeof import('../src/auth.ts')
  >('../src/auth.ts', mocks)
  await t.rejects(getToken('not a url', ''))
  getKC('').set('https://x.com', 'Bearer stokenboken')
  t.equal(await getToken('https://x.com/', ''), 'Bearer stokenboken')
  t.strictSame(checkLog(getKC('')), [
    ['set', 'https://x.com', 'Bearer stokenboken'],
    ['get', 'https://x.com'],
  ])
  process.env.NRZ_TOKEN = 'fromenv'
  process.env.NRZ_REGISTRY = 'https://asdf.com/'
  t.strictSame(
    await getToken('https://asdf.com', ''),
    'Bearer fromenv',
  )
  process.env.NRZ_TOKEN_https_foo_com_8080 = 'foofromenv'
  t.strictSame(
    await getToken('https://foo.com:8080/', ''),
    'Bearer foofromenv',
  )
})

t.test('getToken with path-scoped registry', async t => {
  const { getToken } = await t.mockImport<
    typeof import('../src/auth.ts')
  >('../src/auth.ts', mocks)
  process.env.NRZ_TOKEN = 'luketoken'
  process.env.NRZ_REGISTRY =
    'https://registry.nrz.khulnasoft.com/luke/'
  t.equal(
    await getToken('https://registry.nrz.khulnasoft.com/luke/', ''),
    'Bearer luketoken',
  )
  // Trailing slash normalization
  t.equal(
    await getToken('https://registry.nrz.khulnasoft.com/luke', ''),
    'Bearer luketoken',
  )
})

t.test('runtime tokens take precedence', async t => {
  const {
    getToken,
    setRuntimeToken,
    clearRuntimeTokens,
    runtimeTokens,
  } = await t.mockImport<typeof import('../src/auth.ts')>(
    '../src/auth.ts',
    mocks,
  )
  t.equal(runtimeTokens.size, 0)
  setRuntimeToken('https://x.com/', 'Bearer oidc-token')
  t.equal(runtimeTokens.size, 1)
  t.equal(await getToken('https://x.com/', ''), 'Bearer oidc-token')
  // env vars should be ignored when runtime token is set
  process.env.NRZ_TOKEN = 'fromenv'
  process.env.NRZ_REGISTRY = 'https://x.com/'
  t.equal(await getToken('https://x.com/', ''), 'Bearer oidc-token')
  clearRuntimeTokens()
  t.equal(runtimeTokens.size, 0)
  // now falls back to env
  t.equal(await getToken('https://x.com/', ''), 'Bearer fromenv')
})

t.test(
  'runtime tokens for path-scoped registries are independent',
  async t => {
    const {
      getToken,
      setRuntimeToken,
      clearRuntimeTokens,
      runtimeTokens,
    } = await t.mockImport<typeof import('../src/auth.ts')>(
      '../src/auth.ts',
      mocks,
    )
    setRuntimeToken(
      'https://registry.nrz.khulnasoft.com/luke/',
      'Bearer luke-oidc',
    )
    setRuntimeToken(
      'https://registry.nrz.khulnasoft.com/nrz/',
      'Bearer nrz-oidc',
    )
    t.equal(runtimeTokens.size, 2)
    t.equal(
      await getToken('https://registry.nrz.khulnasoft.com/luke/', ''),
      'Bearer luke-oidc',
    )
    t.equal(
      await getToken('https://registry.nrz.khulnasoft.com/nrz/', ''),
      'Bearer nrz-oidc',
    )
    clearRuntimeTokens()
  },
)

t.test('getTokenByURL longest-prefix match', async t => {
  const { getTokenByURL, setRuntimeToken, clearRuntimeTokens } =
    await t.mockImport<typeof import('../src/auth.ts')>(
      '../src/auth.ts',
      mocks,
    )
  setRuntimeToken(
    'https://registry.nrz.khulnasoft.com/luke/',
    'Bearer luke-token',
  )
  setRuntimeToken(
    'https://registry.nrz.khulnasoft.com/nrz/',
    'Bearer nrz-token',
  )

  // Request URL under /luke/ → luke-token
  t.equal(
    await getTokenByURL(
      'https://registry.nrz.khulnasoft.com/luke/@scope/pkg',
      '',
    ),
    'Bearer luke-token',
  )
  // Request URL under /nrz/ → nrz-token
  t.equal(
    await getTokenByURL(
      'https://registry.nrz.khulnasoft.com/nrz/@scope/pkg',
      '',
    ),
    'Bearer nrz-token',
  )
  clearRuntimeTokens()
})

t.test('getTokenByURL exact match', async t => {
  const { getTokenByURL, setRuntimeToken, clearRuntimeTokens } =
    await t.mockImport<typeof import('../src/auth.ts')>(
      '../src/auth.ts',
      mocks,
    )
  setRuntimeToken('https://registry.npmjs.org/', 'Bearer npm-token')
  t.equal(
    await getTokenByURL('https://registry.npmjs.org/', ''),
    'Bearer npm-token',
  )
  t.equal(
    await getTokenByURL('https://registry.npmjs.org/pkg', ''),
    'Bearer npm-token',
  )
  clearRuntimeTokens()
})

t.test('getTokenByURL no match', async t => {
  const { getTokenByURL } = await t.mockImport<
    typeof import('../src/auth.ts')
  >('../src/auth.ts', mocks)
  t.equal(
    await getTokenByURL('https://unknown.com/foo', ''),
    undefined,
  )
  t.equal(await getTokenByURL('file:///a/b', ''), undefined)
})

t.test('getTokenByURL prefers env registry with path', async t => {
  const { getTokenByURL, clearRuntimeTokens } = await t.mockImport<
    typeof import('../src/auth.ts')
  >('../src/auth.ts', mocks)
  clearRuntimeTokens()
  process.env.NRZ_TOKEN = 'env-path-token'
  process.env.NRZ_REGISTRY =
    'https://registry.nrz.khulnasoft.com/luke/'
  t.equal(
    await getTokenByURL(
      'https://registry.nrz.khulnasoft.com/luke/@scope/pkg',
      '',
    ),
    'Bearer env-path-token',
  )
})

t.test(
  'getTokenByURL with keychain entries does prefix match',
  async t => {
    const { getTokenByURL, setToken, clearRuntimeTokens } =
      await t.mockImport<typeof import('../src/auth.ts')>(
        '../src/auth.ts',
        mocks,
      )
    clearRuntimeTokens()
    delete process.env.NRZ_TOKEN
    delete process.env.NRZ_REGISTRY
    // Store tokens in keychain via setToken
    await setToken(
      'https://registry.nrz.khulnasoft.com/luke/',
      'Bearer kc-luke',
      '',
    )
    await setToken(
      'https://registry.nrz.khulnasoft.com/nrz/',
      'Bearer kc-nrz',
      '',
    )

    t.equal(
      await getTokenByURL(
        'https://registry.nrz.khulnasoft.com/luke/@scope/pkg',
        '',
      ),
      'Bearer kc-luke',
    )
    t.equal(
      await getTokenByURL(
        'https://registry.nrz.khulnasoft.com/nrz/@scope/pkg',
        '',
      ),
      'Bearer kc-nrz',
    )
  },
)

t.test('getTokenByURL NRZ_TOKEN_* env vars', async t => {
  const { getTokenByURL, getKC } = await t.mockImport<
    typeof import('../src/auth.ts')
  >('../src/auth.ts', mocks)
  process.env.NRZ_TOKEN_https_npm_corp_com = 'corp'
  process.env.NRZ_TOKEN_https_r_io_acme_npm = 'acme'
  t.teardown(() => {
    delete process.env.NRZ_TOKEN_https_npm_corp_com
    delete process.env.NRZ_TOKEN_https_r_io_acme_npm
  })
  // lossy names, never probed by request URL
  for (const url of [
    'https://npm-corp.com/x.tgz',
    'https://npm.corp/com/x.tgz',
    'https://npm-corp.com/',
    'https://r.io/acme-npm/x',
    // not configured
    'https://npm.corp.com/x.tgz',
  ]) {
    t.equal(await getTokenByURL(url, ''), undefined, url)
  }
  // read for a known key, over its keychain token
  getKC('').set('https://npm.corp.com', 'Bearer kc')
  t.equal(
    await getTokenByURL('https://npm.corp.com/x.tgz', ''),
    'Bearer corp',
  )
  t.equal(
    await getTokenByURL('https://npm-corp.com/x.tgz', ''),
    undefined,
  )
})

t.test('getTokenByURL NRZ_REGISTRY without NRZ_TOKEN', async t => {
  const { getTokenByURL, getKC } = await t.mockImport<
    typeof import('../src/auth.ts')
  >('../src/auth.ts', mocks)
  const { NRZ_TOKEN } = process.env
  delete process.env.NRZ_TOKEN
  process.env.NRZ_REGISTRY =
    'https://registry.nrz.khulnasoft.com/luke/'
  t.teardown(() => {
    delete process.env.NRZ_REGISTRY
    delete process.env.NRZ_TOKEN_https_registry_nrz_io_luke
    if (NRZ_TOKEN) process.env.NRZ_TOKEN = NRZ_TOKEN
  })
  getKC('').set(
    'https://registry.nrz.khulnasoft.com',
    'Bearer kc-origin',
  )
  t.equal(
    await getTokenByURL(
      'https://registry.nrz.khulnasoft.com/luke/pkg',
      '',
    ),
    'Bearer kc-origin',
    'does not shadow a shorter key',
  )
  process.env.NRZ_TOKEN_https_registry_nrz_io_luke = 'luke-env'
  t.equal(
    await getTokenByURL(
      'https://registry.nrz.khulnasoft.com/luke/pkg',
      '',
    ),
    'Bearer luke-env',
    'NRZ_TOKEN_<key> for NRZ_REGISTRY',
  )
})

t.test('registryKeys', async t => {
  const { registryKeys } = await t.mockImport<
    typeof import('../src/auth.ts')
  >('../src/auth.ts', mocks)
  t.strictSame(registryKeys({}), [])
  t.strictSame(
    registryKeys({
      registry: 'https://r.io/',
      registries: {
        npm: 'https://r.io/acme/npm/',
        dup: 'https://r.io/acme/npm',
        empty: '',
        bad: 'not a url',
      },
      'scoped-registries': { '@acme': 'https://r.io/acme/main/' },
      'jsr-registries': { jsr: 'https://npm.jsr.io/' },
    }),
    [
      'https://r.io',
      'https://r.io/acme/npm',
      'https://r.io/acme/main',
      'https://npm.jsr.io',
    ],
  )
})

t.test('getTokenByURL configured registries', async t => {
  const {
    getTokenByURL,
    getKC,
    registryKeys,
    setRuntimeToken,
    clearRuntimeTokens,
  } = await t.mockImport<typeof import('../src/auth.ts')>(
    '../src/auth.ts',
    mocks,
  )
  clearRuntimeTokens()
  process.env.NRZ_TOKEN_https_r_io_acme_npm = 'npm'
  process.env.NRZ_TOKEN_https_r_io_acme_main = 'main'
  t.teardown(() => {
    clearRuntimeTokens()
    delete process.env.NRZ_TOKEN_https_r_io_acme_npm
    delete process.env.NRZ_TOKEN_https_r_io_acme_main
  })
  const keys = registryKeys({
    registries: { npm: 'https://r.io/acme/npm/' },
    'scoped-registries': { '@acme': 'https://r.io/acme/main/' },
  })
  const cases: [string, string | undefined][] = [
    ['https://r.io/acme/npm/lodash', 'Bearer npm'],
    [
      'https://r.io/acme/npm/lodash/-/lodash-4.17.21.tgz',
      'Bearer npm',
    ],
    ['https://r.io/acme/main/@acme%2futils', 'Bearer main'],
    ['https://r.io/acme-npm/x', undefined],
    ['https://r.io/acme/npmx/y', undefined],
    ['https://r.io/x', undefined],
    ['https://r-io/acme/npm/x', undefined],
  ]
  for (const [url, tok] of cases) {
    t.equal(await getTokenByURL(url, '', keys), tok, url)
  }
  t.equal(
    await getTokenByURL('https://r.io/acme/npm/lodash', ''),
    undefined,
    'env not probed without configured keys',
  )
  // env-less configured key does not shadow a shorter keychain key
  getKC('').set('https://r.io', 'Bearer kc')
  const more = [...keys, 'https://r.io/acme/x']
  t.equal(
    await getTokenByURL('https://r.io/acme/x/p', '', more),
    'Bearer kc',
  )
  t.equal(
    await getTokenByURL('https://r.io/acme/npm/lodash', '', more),
    'Bearer npm',
    'env on longer key beats shorter keychain key',
  )
  setRuntimeToken('https://r.io/acme/npm/', 'Bearer rt')
  t.equal(
    await getTokenByURL('https://r.io/acme/npm/lodash', '', keys),
    'Bearer rt',
    'runtime beats env',
  )
})

t.test('get a KC with a different identity', async t => {
  const { getKC } = await t.mockImport<
    typeof import('../src/auth.ts')
  >('../src/auth.ts', mocks)
  expectKeychainApp = 'nrz/auth/politics'
  const kc = getKC('politics')
  t.equal(kc.file, 'nrz/auth/politics/keychain.json')
  t.end()
})
