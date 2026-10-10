# ai-readiness

Score how ready an open source repository is for AI-assisted development.

The [AI Readiness Score](https://ai-floss.github.io/guidelines/readiness/) has four checks, one
point each:

| Check | What counts |
| --- | --- |
| AI usage policy | `AI_POLICY.md`, an AI section in `CONTRIBUTING.md`, or an AI checkbox in the pull request template, in the repository or the owner's `.github` repository |
| Agent guidance files | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, Copilot instructions, or Cursor, Windsurf or Cline rules |
| Tests run in CI | Test code, plus a CI workflow that runs on pull requests |
| AI-assisted review | An AI reviewer's config, an AI review action in CI, or an AI review bot on recent pull requests |

The checks are heuristics: they show that a mechanism exists, not how well it works. Every result
lists the file or activity that satisfied each check, so you can see why.

## Command line

Needs Node.js 20 or later. A GitHub token is read from `GITHUB_TOKEN`, or from the GitHub CLI.

```sh
npx github:AI-FLOSS/ai-readiness owner/repo
```

```text
owner/repo: 3/4
  ✓ AI usage policy  (AI_POLICY.md)
  ✓ Agent guidance files  (AGENTS.md)
  ✓ Tests run in CI  (tests/test_parser.py; CI: .github/workflows/test.yml)
  ✗ AI-assisted review
```

Options: `--json` or `--markdown` change the output, and `--min N` exits with status 1 if any
repository scores below `N`.

## GitHub Action

```yaml
- uses: AI-FLOSS/ai-readiness@v0
  with:
    min-score: 3 # optional: fail below this score
```

The action writes the result to the job summary and sets the `score` and `result` outputs. It scores
the current repository unless you set `repository: owner/name`.

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
