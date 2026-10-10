# ai-readiness

[![AI readiness](https://img.shields.io/endpoint?url=https://ai-floss.github.io/badges/AI-FLOSS/ai-readiness.json)](https://ai-floss.github.io/guidelines/readiness/)

Score how ready an open source repository is for AI-assisted development.

The [AI Readiness Score](https://ai-floss.github.io/guidelines/readiness/) has eight checks, one
point each:

| Check                        | What counts                                                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI usage policy              | `AI_POLICY.md`, an AI section in `CONTRIBUTING.md`, or an AI checkbox in the pull request template, in the repository or the owner's `.github` repository |
| Agent guidance files         | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, Copilot instructions, or Cursor, Windsurf or Cline rules                                                           |
| Tests run in CI              | Test code, plus a CI workflow that runs on pull requests                                                                                                  |
| AI-assisted review           | An AI reviewer's config, an AI review action in CI, a ruleset requiring Copilot review, or an AI review bot on recent pull requests                       |
| Reproducible dev environment | A devcontainer, Nix flake or shell, Dockerfile, devbox, pixi, mise or `.tool-versions` at the root                                                        |
| Quality gates in CI          | A pull request workflow that runs a linter, formatter or type checker, or a pre-commit config                                                             |
| Disclosure in practice       | At least one of the last 100 commits has an AI trailer such as `Assisted-by:`, or one of the last 30 pull requests has a ticked box in an AI section      |
| Protected main branch        | A ruleset or branch protection that requires pull requests or passing checks before merging                                                               |

The checks are heuristics: they show that a mechanism exists, not how well it works. Every result
lists the file or activity that satisfied each check, so you can see why.

## Command line

Needs Node.js 20 or later; `nix develop` gives you a shell with it. A GitHub token is read from `GITHUB_TOKEN`, or from the GitHub CLI.

```sh
npx github:AI-FLOSS/ai-readiness owner/repo
```

```text
owner/repo: 5/8
  ✓ AI usage policy  (AI_POLICY.md)
  ✓ Agent guidance files  (AGENTS.md)
  ✓ Tests run in CI  (tests/test_parser.py; CI: .github/workflows/test.yml)
  ✗ AI-assisted review
  ✓ Reproducible dev environment  (flake.nix)
  ✓ Quality gates in CI  (.github/workflows/lint.yml)
  ✗ Disclosure in practice
  ✗ Protected main branch
```

Options: `--json` or `--markdown` change the output, and `--min N` exits with status 1 if any
repository scores below `N`.

## GitHub Action

```yaml
- uses: AI-FLOSS/ai-readiness@v0
  with:
    min-score: 6 # optional: fail below this score
```

The action writes the result to the job summary and sets the `score`, `total` and `result` outputs. It scores
the current repository unless you set `repository: owner/name`.

## Badge

Projects listed on [Awesome AI-FLOSS](https://ai-floss.github.io/awesome/) and AI-FLOSS
repositories get a weekly-updated shields.io badge; see
[Add a badge](https://ai-floss.github.io/guidelines/readiness/#add-a-badge).

## As a library

```js
import { score } from 'ai-readiness';

const result = await score('owner/repo', { token: process.env.GITHUB_TOKEN });
console.log(result.score, result.checks);
```

## Contributing

Wrong result for your project? [Open an issue](https://github.com/AI-FLOSS/ai-readiness/issues) with
the repository and what the score missed. Detection rules live in `src/rules.mjs` as pure functions,
and every rule change needs a test in `test/rules.test.mjs`. AI-assisted contributions are welcome;
see the [AI policy](https://github.com/AI-FLOSS/.github/blob/main/AI_POLICY.md).

## Licence

[MIT](LICENSE)
