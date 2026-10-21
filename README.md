![nrz](https://github.com/user-attachments/assets/aec7c817-b83f-4d71-b34a-4e480b97e82c)

# nrz

![nrz Version](https://img.shields.io/npm/v/nrz?logo=npm&label=Version)
![Package Downloads](https://img.shields.io/npm/dm/nrz?logo=npm&label=Downloads)
![GitHub Branch Status](https://img.shields.io/github/checks-status/nrz/nrz/main?logo=github&label=GitHub)
![Discord Server Status](https://img.shields.io/discord/1093366081067954178?logo=discord&label=Discord)
[![Socket Security Status](https://socket.dev/api/badge/npm/package/nrz)](https://socket.dev/npm/package/nrz)

**Develop. Run. Distribute.**

This is the source monorepo for the [nrz](https://www.nrz.khulnasoft.com) package
manager.

### Documentation

Full documentation, startup guides & API references can be found at
[docs.nrz.khulnasoft.com](https://docs.nrz.khulnasoft.com).

## Contributing

Development requires Git, Node.js 22.22.x, and the latest released
`nrz` CLI. The repository's [`.nvmrc`](./.nvmrc) selects the supported
Node.js major when using `nvm`.

```bash
# Clone the repository
git clone https://github.com/khulnasoft/nrz.git
cd nrz

# Install and select the Node.js version from .nvmrc
nvm install
nvm use

# Install the released CLI used to bootstrap the repository
curl -fsSL https://install.nrz.khulnasoft.com | bash

# Install dependencies and prepare generated workspace files
nrz install
xvn --recursive prepare

# Run the CLI directly from source
./scripts/bins/nrz --version
```

`nrz setup` is not required for this repository. That command connects
the CLI to a nrz.khulnasoft.com account; this repository's checked-in
[`nrz.json`](./nrz.json) already configures the registry used to
bootstrap its dependencies.

See the [contributing guide](./CONTRIBUTING.md) for development
commands and workspace-specific guidance.

### Contributors

<a href="https://github.com/khulnasoft/nrz/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=nrz/nrz" />
</a>

### Licenses

Below you can find a complete table of each workspace available in
this repository and its corresponding license:

#### Reusable Client Internals (`src/*`)

| Workspace Name                                  | License                                               | Downloads                                                                      |
| ----------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| [@nrz/cache](./src/cache)                       | [BSD-2-Clause-Patent](./src/cache/LICENSE)            | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/cache?logo=npm)            |
| [@nrz/cache-unzip](./src/cache-unzip)           | [BSD-2-Clause-Patent](./src/cache-unzip/LICENSE)      | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/cache-unzip?logo=npm)      |
| [@nrz/cli-sdk](./src/cli-sdk)                   | [BSD-2-Clause-Patent](./src/cli-sdk/LICENSE)          | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/cli-sdk?logo=npm)          |
| [@nrz/cmd-shim](./src/cmd-shim)                 | [BSD-2-Clause-Patent](./src/cmd-shim/LICENSE)         | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/cmd-shim?logo=npm)         |
| [@nrz/config](./src/config)                     | [BSD-2-Clause-Patent](./src/config/LICENSE)           | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/config?logo=npm)           |
| [@nrz/dep-id](./src/dep-id)                     | [BSD-2-Clause-Patent](./src/dep-id/LICENSE)           | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/dep-id?logo=npm)           |
| [@nrz/dot-prop](./src/dot-prop)                 | [MIT](./src/dot-prop/LICENSE)                         | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/dot-prop?logo=npm)         |
| [@nrz/dss-breadcrumb](./src/dss-breadcrumb)     | [BSD-2-Clause-Patent](./src/dss-breadcrumb/LICENSE)   | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/dss-breadcrumb?logo=npm)   |
| [@nrz/dss-parser](./src/dss-parser)             | [BSD-2-Clause-Patent](./src/dss-parser/LICENSE)       | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/dss-parser?logo=npm)       |
| [@nrz/error-cause](./src/error-cause)           | [BSD-2-Clause-Patent](./src/error-cause/LICENSE)      | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/error-cause?logo=npm)      |
| [@nrz/fast-split](./src/fast-split)             | [BSD-2-Clause-Patent](./src/fast-split/LICENSE)       | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/fast-split?logo=npm)       |
| [@nrz/git](./src/git)                           | [ISC](./src/git/LICENSE)                              | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/git?logo=npm)              |
| [@nrz/git-scp-url](./src/git-scp-url)           | [BSD-2-Clause-Patent](./src/git-scp-url/LICENSE)      | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/git-scp-url?logo=npm)      |
| [@nrz/graph](./src/graph)                       | [BSD-2-Clause-Patent](./src/graph/LICENSE)            | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/graph?logo=npm)            |
| [@nrz/graph-run](./src/graph-run)               | [BSD-2-Clause-Patent](./src/graph-run/LICENSE)        | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/graph-run?logo=npm)        |
| [@nrz/init](./src/init)                         | [BSD-2-Clause-Patent](./src/init/LICENSE)             | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/init?logo=npm)             |
| [@nrz/keychain](./src/keychain)                 | [BSD-2-Clause-Patent](./src/keychain/LICENSE)         | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/keychain?logo=npm)         |
| [@nrz/output](./src/output)                     | [BSD-2-Clause-Patent](./src/output/LICENSE)           | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/output?logo=npm)           |
| [@nrz/package-info](./src/package-info)         | [BSD-2-Clause-Patent](./src/package-info/LICENSE)     | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/package-info?logo=npm)     |
| [@nrz/package-json](./src/package-json)         | [BSD-2-Clause-Patent](./src/package-json/LICENSE)     | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/package-json?logo=npm)     |
| [@nrz/pick-manifest](./src/pick-manifest)       | [BSD-2-Clause-Patent](./src/pick-manifest/LICENSE)    | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/pick-manifest?logo=npm)    |
| [@nrz/promise-spawn](./src/promise-spawn)       | [ISC](./src/promise-spawn/LICENSE)                    | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/promise-spawn?logo=npm)    |
| [@nrz/query](./src/query)                       | [BSD-2-Clause-Patent](./src/query/LICENSE)            | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/query?logo=npm)            |
| [@nrz/registry-client](./src/registry-client)   | [BSD-2-Clause-Patent](./src/registry-client/LICENSE)  | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/registry-client?logo=npm)  |
| [@nrz/rollback-remove](./src/rollback-remove)   | [BSD-2-Clause-Patent](./src/rollback-remove/LICENSE)  | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/rollback-remove?logo=npm)  |
| [@nrz/run](./src/run)                           | [BSD-2-Clause-Patent](./src/run/LICENSE)              | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/run?logo=npm)              |
| [@nrz/satisfies](./src/satisfies)               | [BSD-2-Clause-Patent](./src/satisfies/LICENSE)        | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/satisfies?logo=npm)        |
| [@nrz/security-archive](./src/security-archive) | [BSD-2-Clause-Patent](./src/security-archive/LICENSE) | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/security-archive?logo=npm) |
| [@nrz/semver](./src/semver)                     | [BSD-2-Clause-Patent](./src/semver/LICENSE)           | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/semver?logo=npm)           |
| [@nrz/spec](./src/spec)                         | [BSD-2-Clause-Patent](./src/spec/LICENSE)             | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/spec?logo=npm)             |
| [@nrz/tar](./src/tar)                           | [BSD-2-Clause-Patent](./src/tar/LICENSE)              | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/tar?logo=npm)              |
| [@nrz/types](./src/types)                       | [BSD-2-Clause-Patent](./src/types/LICENSE)            | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/types?logo=npm)            |
| [@nrz/url-open](./src/url-open)                 | [BSD-2-Clause-Patent](./src/url-open/LICENSE)         | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/url-open?logo=npm)         |
| [@nrz/nrz-json](./src/nrz-json)                 | [BSD-2-Clause-Patent](./src/nrz-json/LICENSE)         | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/nrz-json?logo=npm)         |
| [@nrz/nrx](./src/nrx)                           | [BSD-2-Clause-Patent](./src/nrx/LICENSE)              | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/nrx?logo=npm)              |
| [@nrz/which](./src/which)                       | [ISC](./src/which/LICENSE)                            | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/which?logo=npm)            |
| [@nrz/workspaces](./src/workspaces)             | [BSD-2-Clause-Patent](./src/workspaces/LICENSE)       | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/workspaces?logo=npm)       |
| [@nrz/xdg](./src/xdg)                           | [BSD-2-Clause-Patent](./src/xdg/LICENSE)              | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/xdg?logo=npm)              |

#### Infrastructure (`infra/*`)

| Workspace Name                        | License                                           | Downloads                                                            |
| ------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------- |
| [@nrz/benchmark](./infra/benchmark)   | [BSD-2-Clause-Patent](./infra/benchmark/LICENSE)  | N/A                                                                  |
| [@nrz/infra-build](./infra/build)     | [BSD-2-Clause-Patent](./infra/build/LICENSE)      | N/A                                                                  |
| [nrz](./infra/cli)                    | [BSD-2-Clause-Patent](./infra/cli/LICENSE)        | ![NPM Downloads](https://img.shields.io/npm/dm/nrz?logo=npm)         |
| [@nrz/cli-js](./infra/cli-js)         | [BSD-2-Clause-Patent](./infra/cli-js/LICENSE)     | ![NPM Downloads](https://img.shields.io/npm/dm/@nrz/cli-js?logo=npm) |
| [@nrz/smoke-test](./infra/smoke-test) | [BSD-2-Clause-Patent](./infra/smoke-test/LICENSE) | N/A                                                                  |

#### Documentation (`www/*`)

| Workspace Name          | License                                   |
| ----------------------- | ----------------------------------------- |
| [@nrz/docs](./www/docs) | [BSD-2-Clause-Patent](./www/docs/LICENSE) |
