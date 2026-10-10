// GitHub Action entry point: scores a repository, writes the job summary and outputs, and enforces a minimum.
import { appendFileSync } from 'node:fs';
import { formatMarkdown, score } from './score.mjs';

const { INPUT_REPOSITORY: repo, INPUT_MIN_SCORE: min = '0', INPUT_TOKEN: token, GITHUB_OUTPUT, GITHUB_STEP_SUMMARY } = process.env;

const r = await score(repo, { token });
const markdown = formatMarkdown(r);
console.log(markdown);

if (GITHUB_STEP_SUMMARY) appendFileSync(GITHUB_STEP_SUMMARY, `${markdown}\n`);
if (GITHUB_OUTPUT) {
	appendFileSync(GITHUB_OUTPUT, `score=${r.score}\n`);
	appendFileSync(GITHUB_OUTPUT, `result=${JSON.stringify(r)}\n`);
}
if (r.score < Number(min)) {
	console.log(`::error::AI Readiness Score ${r.score}/4 is below the minimum of ${min}.`);
	process.exit(1);
}
