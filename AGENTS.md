# Instructions for AI agents

This repository is `ai-readiness`, a dependency-free Node.js CLI, library and GitHub Action.

- Detection rules live in `src/rules.mjs` as pure functions; keep network access in `src/score.mjs`.
- Add or update a test in `test/rules.test.mjs` for every rule change, including a case that must not match.
- Prefer missing a project over a false positive: a check should pass only on clear evidence.
- Do not add dependencies; use Node's standard library and `fetch`.
- Run `npm test` and make sure it passes before proposing a change.
- Keep `README.md` and the AI-FLOSS readiness guide in step when a check's meaning changes.
- In the pull request, state which parts were written or changed by AI.
