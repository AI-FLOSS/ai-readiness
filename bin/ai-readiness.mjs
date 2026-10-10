#!/usr/bin/env node
// Command-line entry point: scores one or more GitHub repositories.
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { formatMarkdown, formatText, score } from '../src/score.mjs';

const USAGE = `usage: ai-readiness [--json | --markdown] [--min N] owner/repo [owner/repo ...]

Scores repositories on the AI-FLOSS AI Readiness Score (https://ai-floss.github.io/guidelines/readiness/).
Reads a token from GITHUB_TOKEN, or from the GitHub CLI when it is installed.
Exits with status 1 if any repository scores below --min.`;

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		json: { type: 'boolean' },
		markdown: { type: 'boolean' },
		min: { type: 'string', default: '0' },
		help: { type: 'boolean', short: 'h' },
	},
});

if (values.help || !positionals.length) {
	console.error(USAGE);
	process.exit(values.help ? 0 : 2);
}

const token =
	process.env.GITHUB_TOKEN ||
	(() => {
		try {
			return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
		} catch {
			return undefined;
		}
	})();

const min = Number(values.min);
let failed = false;
const results = [];
for (const slug of positionals) {
	try {
		const r = await score(slug, { token });
		results.push(r);
		if (r.score < min) failed = true;
		if (!values.json) console.log(values.markdown ? formatMarkdown(r) : formatText(r));
	} catch (err) {
		console.error(err.message);
		failed = true;
	}
}
if (values.json) console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
process.exit(failed ? 1 : 0);
