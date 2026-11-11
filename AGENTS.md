# Instructions for AI agents

This repository is `ai-readiness`, a dependency-free Node.js CLI, library and GitHub Action.

- Detection rules live in `src/rules.mjs` as pure functions; keep network access in `src/score.mjs`.
- Add or update a test in `test/rules.test.mjs` for every rule change, including a case that must not match.
- Prefer missing a project over a false positive: a check should pass only on clear evidence.
- Do not add dependencies; use Node's standard library and `fetch`.
- Run `npm test` and make sure it passes before proposing a change.
- Keep `README.md` and the X-Tech Laboratories readiness guide in step when a check's meaning changes.
- In the pull request, state which parts were written or changed by AI.

## X-Tech standards

- Follow the [Application Standard](https://x-tech-laboratories.github.io/standards/application/) and the
  [Design Guidelines](https://x-tech-laboratories.github.io/standards/design/), whose source is `src/content/docs/standards/`
  in [x-tech-laboratories.github.io](https://github.com/x-tech-laboratories/x-tech-laboratories.github.io). Ask before
  changing either, since a change applies to every X-app.
- Use [X-Libs](https://github.com/x-tech-laboratories/X-Libs) and Halon ([X-Themes](https://github.com/x-tech-laboratories/X-Themes))
  before writing your own code: check the module table in the X-Libs README first.
- A feature another app could use belongs in X-Libs, or Halon for styling, with tests and a README row. If that is out
  of reach, add it to the candidates in X-Libs' `docs/TODO.md`.
