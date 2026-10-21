// Resolve TypeScript-era `.js` specifiers to their `.ts` source.
//
// Workspace sources import siblings as `./foo.js` so the compiled output
// works, but a fresh checkout only has `./foo.ts`. When the `.js` file is
// absent, fall back to the `.ts` file so the source CLI (`scripts/bins/nrz`)
// can run without a prior `prepack`/`build`.
import { registerHooks } from 'node:module'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier.endsWith('.js') &&
      (specifier.startsWith('./') || specifier.startsWith('../')) &&
      context.parentURL
    ) {
      const url = new URL(specifier, context.parentURL)
      if (!existsSync(fileURLToPath(url))) {
        const tsUrl = new URL(
          `${specifier.slice(0, -3)}.ts`,
          context.parentURL,
        )
        if (existsSync(fileURLToPath(tsUrl))) {
          return { url: tsUrl.href, shortCircuit: true }
        }
      }
    }
    return nextResolve(specifier, context)
  },
})
