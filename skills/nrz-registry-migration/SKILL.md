---
name: nrz-registry-migration
description:
  Moves a JavaScript repository (single package or monorepo) onto a
  nrz.io registry. Routes installs through the account's npm mirror
  and private `main` registry, handles the lockfile, and sets up auth
  for npm, pnpm, yarn, bun, deno and the nrz CLI on laptops, CI,
  Vercel and coding-agent sandboxes. Use when the user wants to switch
  a repo or pipeline to registry.nrz.io, set up nrz.io tokens, or fix
  401s or missing auth after switching.
---

# Migrate a repository to the nrz registry

Docs index: [llms.txt](https://docs.nrz.khulnasoft.com/llms.txt).
Every docs page is Markdown at its URL + `.md`; read the linked page
before editing config. Examples use the account slug `acme`; replace
it with the user's.

## Rules

- Confirm with the user before creating or revoking tokens, changing
  access, or publishing.
- Never commit or print a literal token, and never write one into a
  project config file.
- Change only registry routing and auth. Keep scripts, dependencies
  and `packageManager` unless the user agrees.
- Confirm before deleting or regenerating a lockfile.

## 1. Gather

- Account slug and private scope(s), e.g. `@acme`.
- Package manager and version (`packageManager`, lockfile); Turborepo?
  (see [Known limitations](#known-limitations)).
- Where installs run: laptops, CI provider, Vercel, coding-agent
  sandboxes.

Each account has two registries:

- `https://registry.nrz.io/acme/npm/`: npm mirror. Make it the default
  registry. Always needs a token, even for public packages.
- `https://registry.nrz.io/acme/main/`: the account's own packages.
  Map the scope to it.

Accounts
([sign up](https://docs.nrz.khulnasoft.com/registry.md#sign-up),
[tokens](https://docs.nrz.khulnasoft.com/registry/tokens.md#personal-and-service-tokens)):
invite each developer, who logs in (or creates a personal token). CI,
Vercel and each agent sandbox get their own `package:read` service
token, created by an owner or admin (add `package:write` only to
publish).

## 2. Route installs

Commit the routing (auth is step 4):

| Tool            | File          | Default → mirror              | `@acme` → `main`                   |
| --------------- | ------------- | ----------------------------- | ---------------------------------- |
| npm, pnpm, deno | `.npmrc`      | `registry=`                   | `@acme:registry=`                  |
| yarn 2+         | `.yarnrc.yml` | `npmRegistryServer`           | `npmScopes.acme.npmRegistryServer` |
| bun             | `bunfig.toml` | `[install] registry`          | `[install.scopes] acme`            |
| nrz             | `nrz.json`    | `registry` + `registries.npm` | `scoped-registries` `"@acme"`      |

Full config:
[nrz](https://docs.nrz.khulnasoft.com/registry/publishing/nrz.md#manual-configuration),
[npm](https://docs.nrz.khulnasoft.com/registry/publishing/npm.md#the-config-file),
[pnpm](https://docs.nrz.khulnasoft.com/registry/publishing/pnpm.md#the-config-file),
[yarn](https://docs.nrz.khulnasoft.com/registry/publishing/yarn.md#the-config-file),
[bun](https://docs.nrz.khulnasoft.com/registry/publishing/bun.md#quick-start),
[deno](https://docs.nrz.khulnasoft.com/registry/publishing/deno.md#quick-start).

- yarn: `npmScopes` keys drop the `@`; Classic 1.x uses `.npmrc`.
- nrz: write `nrz.json` with `nrz config set` (nrz guide).
  `nrz setup acme` only writes the `npm` / `main` aliases to user
  config.
- pnpm < 11.10 ignores `registry` in `pnpm-workspace.yaml` for
  installs: keep `registry` and `@acme:registry` in `.npmrc`
  (`pnpm config set … --location=project` writes it).
  `pnpm-workspace.yaml` can't hold auth either.

## 3. Lockfile

- npm: keep `package-lock.json`; `npm install` fetches its
  `registry.npmjs.org` entries from the mirror (other hosts aren't
  rewritten).
- pnpm: keep `pnpm-lock.yaml` (no tarball URLs); `pnpm install`.
- nrz: a kept `nrz-lock.json` still fetches from the old registry
  ([#1579](https://github.com/khulnasoft/nrz/issues/1579)):
  `rm -rf nrz-lock.json node_modules && nrz install`.
- yarn, bun, deno: regenerate `yarn.lock` / `bun.lock` / `deno.lock`
  per their guide.

## 4. Auth: who reads what

Only the nrz CLI reads `NRZ_TOKEN` itself. Other tools see the secret
only through an auth line that references it, so setting the secret
alone sends no credentials.

| Tool          | Auth from                                            | Token reference in committed project file |
| ------------- | ---------------------------------------------------- | ----------------------------------------- |
| nrz           | keychain or env vars (below)                         | n/a, `.npmrc` not read                    |
| npm, npx      | `.npmrc`                                             | expanded                                  |
| pnpm          | `pnpm login`, `~/.npmrc`, or `pnpm_config_…` env var | **ignored** (11.5.3+)                     |
| yarn          | `.yarnrc.yml` (Classic: `.npmrc`)                    | expanded                                  |
| bun           | `bunfig.toml` (`$NRZ_TOKEN`) or `.npmrc`             | expanded                                  |
| deno          | `.npmrc`                                             | expanded                                  |
| Vercel builds | `.npmrc` written from `NPM_RC`                       | see step 5                                |

- Laptops: personal token per developer. Export `NRZ_TOKEN` where
  committed files reference it; pnpm: `pnpm login --registry=<url>`
  per registry URL (`--scope=@acme` for `main`); nrz:
  `nrz setup acme`.
- npm, yarn, bun, deno: commit auth lines for both registry URLs
  referencing `${NRZ_TOKEN}` (`$NRZ_TOKEN` in `bunfig.toml`; yarn also
  `npmAlwaysAuth: true`). npm, bun and deno send an unset var
  literally, which fails like a bad token.
- pnpm: commit routing only. In CI use one of
  ([pnpm in CI](https://docs.nrz.khulnasoft.com/registry/publishing/ci.md#pnpm-needs-a-different-approach)):
  - `env "pnpm_config_//registry.nrz.io/acme/npm/:_authToken=$NRZ_TOKEN" pnpm install --frozen-lockfile`
    (pnpm 11.6.0+; one var per registry URL);
  - a step appending
    `//registry.nrz.io/acme/npm/:_authToken=${NRZ_TOKEN}` and the same
    `main` line to user-level `~/.npmrc` with a quoted heredoc
    (`<<'EOF'` keeps `${NRZ_TOKEN}` literal; pnpm expands it there);
  - `PNPM_CONFIG_NPMRC_AUTH_FILE=<auth file outside the repo>`.
- nrz: per-registry
  `NRZ_TOKEN_<registry URL, trailing / dropped, each run of non-alphanumerics → _>`,
  e.g. `NRZ_TOKEN_https_registry_nrz_io_acme_npm` and
  `NRZ_TOKEN_https_registry_nrz_io_acme_main`. See
  [Authentication](https://docs.nrz.khulnasoft.com/client/auth.md#ci-and-other-headless-environments).

## 5. CI and hosted environments

Details:
[CI & automation](https://docs.nrz.khulnasoft.com/registry/publishing/ci.md#who-reads-what).

- [GitHub Actions](https://docs.nrz.khulnasoft.com/registry/publishing/ci.md#github-actions):
  secret `NRZ_TOKEN` in the job `env` (plus pnpm / nrz auth from step
  4); install with the frozen-lockfile flag.
- [Vercel](https://docs.nrz.khulnasoft.com/registry/publishing/ci.md#vercel):
  ignores `NRZ_TOKEN`. Set `NPM_RC` (not `NPM_TOKEN`) to the routing
  and auth lines with a `package:read` service token, and keep a
  `registry.npmjs.org` line: Vercel installs its runtimes from it. Set
  multi-line values with the Vercel CLI.
- [Coding-agent sandboxes](https://docs.nrz.khulnasoft.com/registry/publishing/ci.md#coding-agent-sandboxes)
  (Cursor, Claude Code, Devin, Codespaces, …): treat each like a CI
  runner. Own service token in that environment's secrets, committed
  routing, auth for both registry URLs as in step 4.
- [Publishing from CI](https://docs.nrz.khulnasoft.com/registry/publishing/ci.md#publishing-from-ci):
  service token with `package:write`; a personal token fails with
  `EOTP`.

## Known limitations

- Turborepo doesn't support nrz as a package manager:
  `"packageManager": "nrz@…"` fails with
  `Invalid packageManager field`, and turbo requires `packageManager`
  or `devEngines.packageManager` (seen on turbo 2.10). In Turborepo
  repos keep npm, pnpm, yarn or bun as `packageManager` and use the
  nrz registry through that tool's config
  ([#1851](https://github.com/khulnasoft/nrz/issues/1851)).

## Verify

- `npm config get registry` / `pnpm config get registry` print the
  mirror. pnpm < 11.10 still installs from npmjs.org if `registry` is
  only in `pnpm-workspace.yaml`, even when this passes: move it to
  `.npmrc`.
- `nrz ping` checks the default registry and `registries` aliases (not
  `scoped-registries`). Read its output: it exits 0 even when a ping
  fails.
- Clean frozen-lockfile install, locally and in CI: no `401`.

## Troubleshooting

| Symptom                                                     | Cause                                                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `401` / `No authorization header was set`                   | token not reaching the tool (step 4): pnpm `${NRZ_TOKEN}` in a project `.npmrc`, or secret unset in that job                         |
| `EOTP` when publishing from CI                              | personal token; use a service token                                                                                                  |
| nrz still fetches from `registry.npmjs.org`                 | kept `nrz-lock.json` (step 3)                                                                                                        |
| pnpm 12 `no version found for the latest tag` on the mirror | mirror bug on pnpm 12: [pnpm guide](https://docs.nrz.khulnasoft.com/registry/publishing/pnpm.md) pins `pnpm@11.26.0` (confirm first) |
