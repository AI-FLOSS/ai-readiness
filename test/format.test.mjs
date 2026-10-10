import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatMarkdown, formatText } from '../src/score.mjs';

const result = {
	repo: 'owner/repo',
	score: 2,
	total: 4,
	checks: {
		policy: { pass: true, evidence: 'AI_POLICY.md' },
		agents: { pass: true, evidence: 'AGENTS.md' },
		tests: { pass: false, evidence: null },
		review: { pass: false, evidence: null },
	},
};

test('text output lists every check with its evidence', () => {
	assert.equal(
		formatText(result),
		[
			'owner/repo: 2/4',
			'  ✓ AI usage policy  (AI_POLICY.md)',
			'  ✓ Agent guidance files  (AGENTS.md)',
			'  ✗ Tests run in CI',
			'  ✗ AI-assisted review',
		].join('\n'),
	);
});

test('markdown output is a table with the score in the heading', () => {
	const md = formatMarkdown(result);
	assert.match(md, /^### AI Readiness Score for owner\/repo: 2\/4$/m);
	assert.match(md, /\| ✅ \| AI usage policy \| `AI_POLICY.md` \|/);
	assert.match(md, /\| ❌ \| Tests run in CI \| {2}\|/);
});

test('markdown output escapes pipes in evidence', () => {
	const r = structuredClone(result);
	r.checks.policy.evidence = 'a|b';
	assert.match(formatMarkdown(r), /`a\\\|b`/);
});
