![build](https://github.com/user-attachments/assets/4ceaa394-8707-4bb3-935a-b29cd2c397ee)

# @nrz/infra-build

> An internal only workspace that is not published to any registry.

Utilized for building nrz.

## Usage

**Bundle**

```ts
import { bundle } from '@nrz/infra-build'

const whichBinsToBundle = ['nrz'] as const
const bundleResult = await bundle({ outdir: './bundle', bins })
```

**CLI**

```bash
nrz-build --outdir=bundle --bins=nrz bundle
```
