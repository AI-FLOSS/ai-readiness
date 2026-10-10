// Detection rules for the four readiness checks, as pure functions over file paths and file contents.

const AGENT_FILES = [
	/(^|\/)AGENTS\.md$/,
	/(^|\/)CLAUDE\.md$/,
	/(^|\/)GEMINI\.md$/,
	/^\.github\/copilot-instructions\.md$/,
	/^\.github\/instructions\/.+\.instructions\.md$/,
	/^\.cursorrules$/,
	/^\.cursor\/rules\//,
	/^\.windsurfrules$/,
	/^\.clinerules/,
];

const POLICY_FILES = [/(^|\/)AI[_-]?POLICY(\.md)?$/i, /(^|\/)(AI|LLM)[_-]?(USAGE|CONTRIBUTIONS?)\.md$/i];
const POLICY_CANDIDATES = [/^(\.github\/|docs\/)?CONTRIBUTING(\.md)?$/i, /^(\.github\/|docs\/)?pull_request_template\.md$/i];

// A heading or checkbox about using AI, such as "## AI-assisted contributions" or "- [ ] Written with AI".
const AI_TERM = String.raw`(\bAI\b|\bLLMs?\b|[Aa]rtificial [Ii]ntelligence|[Gg]enerative|[Cc]oding agents?)`;
const AI_USE = String.raw`(polic|assist|generat|usage|use of|using|disclos|contribut|written|tool|develop)`;
const AI_HEADING = new RegExp(String.raw`^(#{1,6}|\s*[-*] \[ \]).*(${AI_TERM}.*${AI_USE}|${AI_USE}.*${AI_TERM})`, 'mi');

const TEST_FILES = [
	/(^|\/)(tests?|__tests__|spec|testing)\//,
	/_test\.(go|py|rs|exs|dart)$/,
	/\.(test|spec)\.[cm]?[jt]sx?$/,
	/(^|\/)test_[^/]+\.py$/,
	/Tests?\.(cs|java|kt|swift)$/,
];
const NOT_CODE = /(^|\/)\.|\.(md|mdx|txt|json|ya?ml)$/i;
const TEST_COMMAND = /run:.*\b(test|tests|pytest|jest|vitest|nextest|ctest|tox|nox|rspec|phpunit|check)\b|uses:.*test/i;
const OTHER_CI = [/^\.circleci\//, /^\.buildkite\//, /^\.gitlab-ci\.yml$/, /^\.travis\.yml$/, /^\.cirrus\.yml$/, /^\.woodpecker/];

const REVIEW_FILES = [/^\.coderabbit\.ya?ml$/, /^\.gemini\/config\.ya?ml$/, /^\.sourcery\.ya?ml$/, /^\.pr_agent\.toml$/, /^greptile\.json$/];
const REVIEW_ACTIONS =
	/anthropics\/claude-code-action|openai\/codex-action|run-gemini-cli|coderabbitai\/|pr-agent|sourcery-ai\/|ai-code-review/i;
export const REVIEW_BOTS = new Set([
	'coderabbitai[bot]',
	'copilot-pull-request-reviewer[bot]',
	'Copilot',
	'claude[bot]',
	'gemini-code-assist[bot]',
	'sourcery-ai[bot]',
	'qodo-merge-pro[bot]',
	'greptile-apps[bot]',
	'cursor[bot]',
	'chatgpt-codex-connector[bot]',
	'ellipsis-dev[bot]',
]);

const first = (paths, patterns) => paths.find((p) => patterns.some((re) => re.test(p)));

/** The first dedicated AI policy file, if any. */
export const policyFile = (paths) => first(paths, POLICY_FILES);

/** Files that count as a policy when they contain an AI heading or checkbox. */
export const policyCandidates = (paths) => paths.filter((p) => POLICY_CANDIDATES.some((re) => re.test(p)));

/** Whether Markdown text has a heading or checkbox about using AI. */
export const mentionsAiUse = (text) => AI_HEADING.test(text ?? '');

/** The first instruction file for AI agents, if any. */
export const agentFile = (paths) => first(paths, AGENT_FILES);

/** The first test file that is code rather than documentation, if any. */
export const testFile = (paths) => first(paths.filter((p) => !NOT_CODE.test(p)), TEST_FILES);

/**
 * The CI configuration that runs tests on pull requests, if any.
 * @param {string[]} paths
 * @param {[string, string][]} workflows GitHub Actions workflow paths and contents
 */
export function ciConfig(paths, workflows) {
	const onPr = workflows.filter(([, text]) => /pull_request/.test(text));
	return (
		onPr.find(([p]) => /test/i.test(p))?.[0] ?? onPr.find(([, text]) => TEST_COMMAND.test(text))?.[0] ?? first(paths, OTHER_CI)
	);
}

/** An AI reviewer's config file or a workflow that runs an AI review, if any. */
export const reviewConfig = (paths, workflows) =>
	first(paths, REVIEW_FILES) ?? workflows.find(([, text]) => REVIEW_ACTIONS.test(text))?.[0];

/** The first comment left by a known AI review bot, if any. */
export const reviewBotComment = (comments) => comments.find((c) => REVIEW_BOTS.has(c.user?.login));
