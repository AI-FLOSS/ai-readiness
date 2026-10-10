// Scores a GitHub repository by reading its file tree, workflows and recent pull request comments.
import * as rules from './rules.mjs';

export const CHECKS = {
	policy: 'AI usage policy',
	agents: 'Agent guidance files',
	tests: 'Tests run in CI',
	review: 'AI-assisted review',
	environment: 'Reproducible dev environment',
	quality: 'Quality gates in CI',
	disclosure: 'Disclosure in practice',
	protection: 'Protected main branch',
};

/** Makes a small GitHub REST client. */
export function github(token) {
	return async function api(path, { raw = false } = {}) {
		const res = await fetch(`https://api.github.com/${path}`, {
			headers: {
				Accept: raw ? 'application/vnd.github.raw' : 'application/vnd.github+json',
				'User-Agent': 'ai-readiness',
				...(token && { Authorization: `Bearer ${token}` }),
			},
		});
		if (res.status === 404) return null;
		if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
		return raw ? res.text() : res.json();
	};
}

async function tree(api, slug) {
	const repo = await api(`repos/${slug}`);
	if (!repo) return null;
	const t = await api(`repos/${slug}/git/trees/${repo.default_branch}?recursive=1`);
	return { branch: repo.default_branch, paths: t.tree.map((e) => e.path), truncated: Boolean(t.truncated) };
}

async function findPolicy(api, slug, paths) {
	const found = rules.policyFile(paths);
	if (found) return found;
	for (const p of rules.policyCandidates(paths)) {
		if (rules.mentionsAiUse(await api(`repos/${slug}/contents/${encodeURI(p)}`, { raw: true }))) return p;
	}
	return undefined;
}

/**
 * Scores one repository.
 * @param {string} slug owner/name
 * @param {{ token?: string }} options
 */
export async function score(slug, { token } = {}) {
	const api = github(token);
	const t = await tree(api, slug);
	if (!t) throw new Error(`${slug}: repository not found`);
	const { paths } = t;

	const workflowPaths = paths.filter((p) => /^\.github\/workflows\/[^/]+\.ya?ml$/.test(p)).slice(0, 30);
	const workflows = await Promise.all(
		workflowPaths.map(async (p) => [p, (await api(`repos/${slug}/contents/${encodeURI(p)}`, { raw: true })) ?? '']),
	);

	// The owner's .github repository supplies defaults to every repository, so its policy counts too.
	let policy = await findPolicy(api, slug, paths);
	const [owner, name] = slug.split('/');
	if (!policy && name !== '.github') {
		const defaults = await tree(api, `${owner}/.github`);
		const found = defaults && (await findPolicy(api, `${owner}/.github`, defaults.paths));
		if (found) policy = `${owner}/.github: ${found}`;
	}

	const agents = rules.agentFile(paths);
	const tests = rules.testFile(paths);
	const ci = rules.ciConfig(paths, workflows);

	const branch = encodeURIComponent(t.branch);
	const branchRules = (await api(`repos/${slug}/rules/branches/${branch}`)) ?? [];
	const branchInfo = await api(`repos/${slug}/branches/${branch}`);

	let review = rules.reviewConfig(paths, workflows) ?? rules.reviewRule(branchRules);
	if (!review) {
		const recent = [
			...((await api(`repos/${slug}/pulls/comments?per_page=100&sort=created&direction=desc`)) ?? []),
			...((await api(`repos/${slug}/issues/comments?per_page=100&sort=created&direction=desc`)) ?? []),
		];
		const bot = rules.reviewBotComment(recent);
		if (bot) review = `${bot.user.login} on ${bot.html_url}`;
	}

	const environment = rules.environmentFile(paths);
	const quality = rules.qualityGate(paths, workflows);
	const protection = rules.branchProtection(branchRules, branchInfo);

	const commits = (await api(`repos/${slug}/commits?per_page=100`)) ?? [];
	const pulls = (await api(`repos/${slug}/pulls?state=all&per_page=30`)) ?? [];
	const disclosed = [
		[rules.disclosedCommits(commits).length, commits.length, 'commits with an AI trailer'],
		[rules.disclosedPullRequests(pulls).length, pulls.length, 'pull requests with AI involvement ticked'],
	]
		.filter(([n]) => n > 0)
		.map(([n, of, what]) => `${n} of the last ${of} ${what}`)
		.join('; ');

	const checks = {
		policy: { pass: Boolean(policy), evidence: policy ?? null },
		agents: { pass: Boolean(agents), evidence: agents ?? null },
		tests: { pass: Boolean(tests && ci), evidence: tests && ci ? `${tests}; CI: ${ci}` : null },
		review: { pass: Boolean(review), evidence: review ?? null },
		environment: { pass: Boolean(environment), evidence: environment ?? null },
		quality: { pass: Boolean(quality), evidence: quality ?? null },
		disclosure: { pass: Boolean(disclosed), evidence: disclosed || null },
		protection: { pass: Boolean(protection), evidence: protection ?? null },
	};
	return {
		repo: slug,
		score: Object.values(checks).filter((c) => c.pass).length,
		total: Object.keys(checks).length,
		checks,
		checkedAt: new Date().toISOString().slice(0, 10),
		truncated: t.truncated,
	};
}

/** Formats a result as plain text, one line per check. */
export function formatText(r) {
	const lines = [`${r.repo}: ${r.score}/${r.total}`];
	for (const [key, c] of Object.entries(r.checks)) {
		lines.push(`  ${c.pass ? '✓' : '✗'} ${CHECKS[key]}${c.evidence ? `  (${c.evidence})` : ''}`);
	}
	return lines.join('\n');
}

/** Formats a result as a Markdown table, for job summaries and comments. */
export function formatMarkdown(r) {
	const rows = Object.entries(r.checks).map(
		([key, c]) => `| ${c.pass ? '✅' : '❌'} | ${CHECKS[key]} | ${c.evidence ? `\`${c.evidence.replace(/\|/g, '\\|')}\`` : ''} |`,
	);
	return [
		`### AI Readiness Score for ${r.repo}: ${r.score}/${r.total}`,
		'',
		'| | Check | Evidence |',
		'| --- | --- | --- |',
		...rows,
		'',
		'What the checks mean: https://ai-floss.github.io/guidelines/readiness/',
	].join('\n');
}
