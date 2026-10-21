# @nrz/docs

The source for [docs.nrz.khulnasoft.com](https://docs.nrz.khulnasoft.com), built with Next.js
and fumadocs. Pages live in `content/`.

```bash
xvn dev            # local dev server on http://localhost:3000
xvn typedoc        # generate content/client/api-reference
xvn build          # skills copy + typedoc + production build
xvn lint:mdx       # structural MDX checks
xvn typedoc:check  # validate TypeDoc links without writing
```

`xvn dev` and `xvn build` copy the agent skills in the repo's root
`skills/` into `public/skills` (gitignored), which serves them at
`/skills/<name>/SKILL.md`. Restart `xvn dev` after editing a skill.
