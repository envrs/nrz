![nrz](https://github.com/user-attachments/assets/aec7c817-b83f-4d71-b34a-4e480b97e82c)

# nrz

![nrz Version](https://img.shields.io/npm/v/nrz?logo=npm&label=Version)
![Package Downloads](https://img.shields.io/npm/dm/nrz?logo=npm&label=Downloads)
![GitHub Branch Status](https://img.shields.io/github/checks-status/nrz/nrz/main?logo=github&label=GitHub)
![Discord Server Status](https://img.shields.io/discord/1093366081067954178?logo=discord&label=Discord)
[![Socket Security Status](https://socket.dev/api/badge/npm/package/nrz)](https://socket.dev/npm/package/nrz)

nrz delivers the tools and infrastructure developers need to
streamline package management, scale efficiently, and secure a faster,
more tailored web experience.

## Getting Started

### Installation

nrz requires Node.js 22.22 or later. Install the CLI with the official
install script:

```bash
curl -fsSL https://install.nrz.khulnasoft.com | bash
```

### Configure a registry

Sign up or log in at [nrz.khulnasoft.com](https://www.nrz.khulnasoft.com), then run the
onboarding wizard:

```bash
nrz setup
```

The wizard authenticates with your account and configures the registry
aliases used by `nrz install` and `nrx`. You can instead
[configure another registry directly](https://docs.nrz.khulnasoft.com/cli/registries).

### Install and run

In an existing JavaScript project:

```bash
# Install dependencies from package.json
nrz install

# Add a dependency
nrz install lodash

# Run a package.json script
nrz run test

# Execute a package without installing it as a dependency
nrx cowsay "hello from nrz"
```

nrz does not run dependency lifecycle scripts during installation.
Review packages that require scripts and build the approved ones
explicitly:

```bash
nrz query ':scripts'
nrz build
```

## Documentation

Visit [docs.nrz.khulnasoft.com](https://docs.nrz.khulnasoft.com/cli)
for guides, migration instructions, configuration, and the complete
command reference.

## Community

Report bugs in
[GitHub Issues](https://github.com/khulnasoft/nrz/issues), ask
questions and share ideas in
[GitHub Discussions](https://github.com/khulnasoft/nrz/discussions),
or chat with the community on
[Discord](https://discord.com/invite/qdbXTqxZzZ). Please follow the
[Code of Conduct](https://github.com/khulnasoft/nrz/blob/main/CODE_OF_CONDUCT.md)
in all community spaces.

## Contributing

Contributions are welcome. Read the
[contributing guide](https://github.com/khulnasoft/nrz/blob/main/CONTRIBUTING.md)
before opening a pull request.

## License

[BSD-2-Clause-Patent](./LICENSE)
