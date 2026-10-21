---
title: '@nrz/graph.lockfile'
---

# @nrz/graph.lockfile

Serialize and deserialize `@nrz/graph.Graph` to/from lockfiles.

## Files

- `nrz-lock.json` — Main lockfile (committed to source control)
- `node_modules/.nrz-lock.json` — Hidden lockfile with manifests and
  build state (performance cache)

## API

### Loading

```ts
import { lockfile } from '@nrz/graph'
import { PackageJson } from '@nrz/package-json'

const packageJson = new PackageJson()
const mainManifest = packageJson.read(projectRoot)

// Load from nrz-lock.json
const graph = lockfile.load({
  projectRoot,
  mainManifest,
  packageJson,
})

// Load from node_modules/.nrz-lock.json (faster, has manifests)
const graph = lockfile.loadHidden({
  projectRoot,
  mainManifest,
  packageJson,
})

// Load from in-memory data
const graph = lockfile.loadObject(
  { projectRoot, mainManifest },
  lockfileData,
)
```

### Saving

```ts
import { lockfile } from '@nrz/graph'

// Save to nrz-lock.json (no manifests, compact format)
lockfile.save({ graph, modifiers })

// Save to node_modules/.nrz-lock.json (includes manifests + build state)
lockfile.saveHidden({ graph, modifiers })

// Get lockfile data without writing
const data = lockfile.lockfileData({ graph, saveManifests: true })
```

## Lockfile Format

```ts
type LockfileData = {
  lockfileVersion: number
  options: SpecOptions & { modifiers?: Record<string, string> }
  nodes: Record<DepID, LockfileNode>
  edges: LockfileEdges
}

// Node: [flags, name?, integrity?, resolved?, location?, manifest?, rawManifest?, platform?, bins?, buildState?]
// Edge key: "${fromId} ${specName}" → value: "${type} ${bareSpec} ${toId|MISSING}"
```

## Options

| Option         | Description                       |
| -------------- | --------------------------------- |
| `projectRoot`  | Project root directory            |
| `mainManifest` | Root package.json contents        |
| `packageJson`  | Shared PackageJson instance       |
| `monorepo`     | Shared Monorepo instance          |
| `scurry`       | Shared PathScurry instance        |
| `modifiers`    | GraphModifier instance            |
| `actual`       | Actual graph to hydrate data from |
