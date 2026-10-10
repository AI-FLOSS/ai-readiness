import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as rules from '../src/rules.mjs';

test('policy: finds dedicated policy files', () => {
	assert.equal(rules.policyFile(['src/a.js', 'AI_POLICY.md']), 'AI_POLICY.md');
	assert.equal(rules.policyFile(['docs/ai-policy.md']), 'docs/ai-policy.md');
	assert.equal(rules.policyFile(['README.md']), undefined);
});

test('policy: candidates are contributing guides and PR templates', () => {
	const paths = ['CONTRIBUTING.md', '.github/pull_request_template.md', 'docs/CONTRIBUTING.md', 'src/CONTRIBUTING.md'];
	assert.deepEqual(rules.policyCandidates(paths), paths.slice(0, 3));
});

test('policy: recognises headings and checkboxes about using AI', () => {
	for (const text of [
		'## AI-assisted contributions',
		'### Use of AI tools',
		'## Developing with AI coding agents',
		'# Generative AI policy',
		'- [ ] This PR was written with meaningful AI assistance',
		'## LLM usage',
	]) {
		assert.ok(rules.mentionsAiUse(text), text);
	}
});

test('policy: ignores AI words that are not about using AI', () => {
	for (const text of ['## LLM Benchmark Results', '## Maintainers', 'We use AI tools a lot (not a heading)', '## Training data', '']) {
		assert.ok(!rules.mentionsAiUse(text), text);
	}
});

test('agents: finds instruction files by exact name', () => {
	assert.equal(rules.agentFile(['AGENTS.md']), 'AGENTS.md');
	assert.equal(rules.agentFile(['packages/core/CLAUDE.md']), 'packages/core/CLAUDE.md');
	assert.equal(rules.agentFile(['.github/copilot-instructions.md']), '.github/copilot-instructions.md');
	assert.equal(rules.agentFile(['.cursor/rules/style.mdc']), '.cursor/rules/style.mdc');
	assert.equal(rules.agentFile(['docs/llms/gemini.md', 'agents.md.bak']), undefined);
});

test('tests: finds test code in common layouts', () => {
	for (const p of ['tests/test_parser.py', 'src/foo_test.go', 'src/app.test.ts', 'pkg/__tests__/x.js', 'Sources/FooTests.swift']) {
		assert.equal(rules.testFile([p]), p, p);
	}
});

test('tests: ignores documentation and hidden folders', () => {
	assert.equal(rules.testFile(['.claude/skills/testing/SKILL.md', 'docs/testing/guide.md', '.github/tests/x.js']), undefined);
});

test('ci: prefers a pull request workflow named for tests', () => {
	const workflows = [
		['.github/workflows/lint.yml', 'on: pull_request\njobs: {}\n run: npm run lint'],
		['.github/workflows/test.yml', 'on: [push, pull_request]'],
	];
	assert.equal(rules.ciConfig([], workflows), '.github/workflows/test.yml');
});

test('ci: accepts a pull request workflow that runs tests', () => {
	const workflows = [['.github/workflows/ci.yml', 'on:\n  pull_request:\nsteps:\n  - run: npm test']];
	assert.equal(rules.ciConfig([], workflows), '.github/workflows/ci.yml');
});

test('ci: ignores workflows that never run on pull requests', () => {
	const workflows = [['.github/workflows/test.yml', 'on:\n  push:\nsteps:\n  - run: npm test']];
	assert.equal(rules.ciConfig([], workflows), undefined);
});

test('ci: accepts other CI systems', () => {
	assert.equal(rules.ciConfig(['.gitlab-ci.yml'], []), '.gitlab-ci.yml');
});

test('review: finds reviewer configs and review actions', () => {
	assert.equal(rules.reviewConfig(['.coderabbit.yaml'], []), '.coderabbit.yaml');
	const workflows = [['.github/workflows/review.yml', 'uses: anthropics/claude-code-action@v1']];
	assert.equal(rules.reviewConfig([], workflows), '.github/workflows/review.yml');
	assert.equal(rules.reviewConfig(['README.md'], [['.github/workflows/ci.yml', 'run: npm test']]), undefined);
});

test('review: finds comments by known review bots only', () => {
	const comments = [{ user: { login: 'someone' } }, { user: { login: 'dependabot[bot]' } }, { user: { login: 'coderabbitai[bot]' } }];
	assert.equal(rules.reviewBotComment(comments)?.user.login, 'coderabbitai[bot]');
	assert.equal(rules.reviewBotComment(comments.slice(0, 2)), undefined);
});
