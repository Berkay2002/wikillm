import type { WikillmConfig } from "./prompts.js";

/**
 * Render the vault's CLAUDE.md synchronously from config.
 *
 * This replaces the previous approach of shelling out to `claude --print
 * /wikillm:generate-schema ...` as a subprocess, which silently failed when
 * the wikillm plugin wasn't enabled in the subprocess's settings. The
 * subprocess approach was also slow, non-deterministic, and couldn't surface
 * errors. Rendering in-process is faster, reliable, and always writes the
 * file. The `/wikillm:generate-schema` skill still exists for on-demand
 * regeneration by an interactive Claude Code session.
 */
export function renderClaudeMd(config: WikillmConfig): string {
  const { name, mode, features, domain, schedule } = config;

  const modeLabel = modeLabelFor(mode);
  const philosophy = philosophyFor(mode, domain);
  const automation = automationFor(mode, schedule);
  const directoryTree = directoryTreeFor(features);
  const featureSections = featureSectionsFor(features);
  const queryExamples = queryExamplesFor(mode, domain);
  const commitRules = commitRulesFor(mode);

  return `# ${name}

${philosophy}

## Directory Structure

${directoryTree}

## Automation

${automation}

## Ingestion

When you add files to \`raw/\`, run \`/wikillm:ingest\` to compile them into wiki articles.

The ingest pipeline:

1. Detects unprocessed files by diffing \`raw/\` against \`wiki/_index/SOURCES.md\`
2. For each new file: identifies concepts, checks existing coverage, decides whether to create new articles or update existing ones
3. Writes articles following the format below, cross-links them with \`[[wikilinks]]\`, and updates all four indices
4. Commits one git commit per source file

For bulk imports (3+ files), ingest dispatches parallel \`ingest-worker\` subagents and does a reconciliation pass at the end to dedupe and cross-link across workers.

See \`/wikillm:ingest\` for the full procedure.

## Query

Use \`/wikillm:query\` to answer questions against the knowledge base. It finds the most relevant wiki articles, reads them, synthesizes an answer, and picks an appropriate output format — inline answer, structured report, slide deck, or visualization.

Example queries for a ${modeLabel} KB:

${queryExamples}

## Wiki Conventions

- **Filenames:** kebab-case (e.g., \`attention-mechanism.md\`)
- **Links:** always use \`[[wikilinks]]\` for cross-references
- **Frontmatter:** YAML on every page (\`created\`, \`updated\`, \`tags\`, \`sources\`)
- **One concept per article.** If an article covers two distinct ideas, split it.
- **Update existing articles** over creating near-duplicates.
- **Mark uncertainty** with \`[unverified]\` inline.

### Article format

\`\`\`markdown
---
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [tag1, tag2]
sources: [raw/source-file.ext]
---

# Article Title

Brief summary (2-3 sentences).

## Content

Main content organized with headers.

## Related

- [[Related Article 1]]
- [[Related Article 2]]

## Sources

- \`raw/source-file.ext\` — what was drawn from this source
\`\`\`

### Cross-linking

- Link on **first mention** of a concept in each article, not every mention.
- A concept deserves its own page if it's a distinct entity, referenced in 2+ articles, or complex enough to need explanation.
- Every article has a \`## Related\` section with 2-5 links.
- Don't over-link common words that happen to be article titles.

## Index System

All four indices live in \`wiki/_index/\` and must be updated after every ingest:

- **INDEX.md** — content catalog: \`- [[article-name]] — one-line summary\` grouped by category.
- **TAGS.md** — tag directory: \`## tag-name\` followed by a list of \`[[articles]]\` using that tag.
- **SOURCES.md** — provenance map: \`- raw/filename.ext → [[summary-page]], [[article-1]], [[article-2]]\`. Used by ingest to detect already-processed files.
- **RECENT.md** — change feed: last 20 changed articles, most recent first.
- **LOG.md** — chronological operation log: \`## [YYYY-MM-DD HH:MM] operation | Title\` with one entry per ingest/lint run.
${featureSections}
## Rules

1. **\`raw/\` is immutable.** Never delete or edit source files. If a source is wrong, add a correction as a new source; the wiki article synthesis will reconcile them.
2. **The wiki is LLM-owned.** The human reads; the LLM writes. Don't hand-edit \`wiki/\` articles — fix things via \`/wikillm:ingest\` or \`/wikillm:lint\`.
3. **Always update indices and \`LOG.md\` after wiki changes.** Out-of-date indices break detection and discovery.
4. ${commitRules}
5. **Use \`[[wikilinks]]\` for all cross-references.** Never use raw relative paths for article-to-article links — they break Obsidian's graph and backlinks.
`;
}

function modeLabelFor(mode: WikillmConfig["mode"]): string {
  switch (mode) {
    case "personal":
      return "personal";
    case "project-solo":
      return "project-solo";
    case "project-team":
      return "project-team";
  }
}

function philosophyFor(mode: WikillmConfig["mode"], domain: string | undefined): string {
  const domainClause = domain
    ? ` It covers ${domain}.`
    : "";

  switch (mode) {
    case "personal":
      return `This is a wikillm knowledge base — your brain extension. A persistent, compounding knowledge artifact maintained by Claude Code from sources dropped into \`raw/\`.${domainClause}

## Philosophy

This is your brain extension. Over time, sources accumulate and the wiki compounds: what you read today becomes cross-referenced with what you read last month. Queries are fast because the synthesis has already been done.

**This is not RAG.** There are no embeddings, no vector stores, no retrieval pipelines at query time. The wiki is compiled once into plain markdown via \`/wikillm:ingest\` and kept current via \`/wikillm:lint\`. When you ask a question, you're reading a pre-written article — not re-deriving the answer from raw text.`;

    case "project-solo":
      return `This is a wikillm knowledge base — the project's compiled understanding of its third-party dependencies and reference material, maintained by Claude Code from sources in \`raw/\`.${domainClause}

## Philosophy

This knowledge base is the project's compiled understanding. When a future Claude Code session (or you) asks "how does this work?" or "what does that endpoint return?", the answer should come from a pre-compiled wiki article — not from paging through megabytes of upstream docs on every query.

The wiki is the knowledge base. Sources in \`raw/\` are the primary material. Articles in \`wiki/\` are the synthesis: one concept per page, cross-linked, up to date. The contradictions have already been flagged. The connections are already drawn.

**This is not RAG.** Knowledge is compiled once into the wiki and kept current via \`/wikillm:ingest\`. Queries read the wiki directly.`;

    case "project-team":
      return `This is a wikillm knowledge base — the team's shared compiled understanding of this project's third-party dependencies and reference material, maintained via Claude Code and committed to git.${domainClause}

## Philosophy

This is the team's shared knowledge base — compiled understanding that everyone reads. It exists so new members can onboard quickly, architecture decisions are documented, and "ask the wiki, not Steve" is a real option.

The wiki is the source of truth for how third-party dependencies work in the context of this project. Sources in \`raw/\` are the primary material. Articles in \`wiki/\` are the synthesis, committed to git so every clone gets them.

**This is not RAG.** Knowledge is compiled once into the wiki and kept current via manual \`/wikillm:ingest\` runs (team mode disables automation to avoid merge conflicts). Queries read the wiki directly.`;
  }
}

function automationFor(mode: WikillmConfig["mode"], schedule: WikillmConfig["schedule"]): string {
  if (mode === "project-team") {
    return `**Manual only.** Team mode disables scheduled automation to avoid merge conflicts from parallel ingest runs. When you add sources:

- Pull the latest \`main\` first
- Run \`/wikillm:ingest\` locally
- Review the wiki changes before committing
- Push and coordinate with the team

For health checks, run \`/wikillm:lint\` manually on a cadence that suits the team.`;
  }

  if (!schedule) {
    return `No scheduled automation configured. Run \`/wikillm:ingest\` manually after adding sources to \`raw/\`, and \`/wikillm:lint\` periodically for health checks.`;
  }

  const lintLine = schedule.lint
    ? `- **Weekly lint** — \`/wikillm:lint\` runs once a week to fix broken wikilinks, find orphan pages, and surface contradictions.`
    : "";

  return `Scheduled tasks run via Claude Desktop and require it to be running:

- **${titleCase(schedule.ingestFrequency)} ingestion** — \`/wikillm:ingest\` runs ${schedule.ingestFrequency} and processes any new files in \`raw/\`. If there are no new files, it exits silently.
${lintLine}

You can also trigger both on demand at any time. Automation is a convenience, not a requirement — \`/wikillm:ingest\` and \`/wikillm:lint\` are the source of truth for when the wiki gets updated.`;
}

function directoryTreeFor(features: string[]): string {
  const outputLines: string[] = [];
  if (features.includes("slides")) {
    outputLines.push("│   ├── slides/            ← generated slide decks");
  }
  if (features.includes("reports")) {
    outputLines.push("│   ├── reports/           ← generated reports");
  }
  if (features.includes("visualizations")) {
    outputLines.push("│   └── visualizations/    ← generated charts, diagrams, plots");
  }

  const outputsBlock = outputLines.length > 0
    ? `├── outputs/
${outputLines.join("\n")}
`
    : "";

  return `\`\`\`
vault-root/
├── CLAUDE.md              ← this file
├── raw/                   ← immutable source material
│   └── assets/            ← images, PDFs, binary attachments
├── wiki/                  ← compiled articles (LLM-owned)
│   └── _index/
│       ├── INDEX.md       ← content catalog by category
│       ├── TAGS.md        ← tag → articles map
│       ├── SOURCES.md     ← raw/ → wiki/ article map
│       ├── RECENT.md      ← last 20 changed articles
│       └── LOG.md         ← chronological operation log
${outputsBlock}└── .obsidian/             ← Obsidian workspace configuration
\`\`\``;
}

function featureSectionsFor(features: string[]): string {
  const sections: string[] = [];

  if (features.includes("slides")) {
    sections.push(`
## Slide Generation

Generated slide decks live in \`outputs/slides/\`. Use \`/wikillm:marp-cli\` to turn wiki content into a Marp-flavored markdown deck and render it to PDF, PPTX, or HTML. See the skill for directive syntax, theme selection, and the wiki-to-slides workflow.`);
  }

  if (features.includes("reports")) {
    sections.push(`
## Reports

Generated reports live in \`outputs/reports/\`. When a query produces a long-form answer worth keeping (research summary, comparison write-up, decision record), save it here and link it from the relevant wiki article. Reports are first-class outputs — they show up in Obsidian search like any other note.`);
  }

  if (features.includes("visualizations")) {
    sections.push(`
## Visualizations

Generated charts, diagrams, and plots live in \`outputs/visualizations/\`. When a query produces a visual answer, save the artifact here and link it from the relevant wiki article:

\`\`\`markdown
![[../outputs/visualizations/<name>.png]]
\`\`\`

Keep visualizations regeneratable — either store the generation script alongside the output or document the prompt that produced it.`);
  }

  if (features.includes("web-clipper")) {
    sections.push(`
## Web Clipper Pipeline

When you clip a webpage via Obsidian Web Clipper (or any browser-to-markdown pipeline), drop the resulting file into \`raw/\`. Ingest will pick it up on the next run — no special handling needed.

Clipped pages should be named descriptively (\`langchain-runnable-sequence-blog.md\`, not \`clipped-2026-04-12.md\`) so future you can tell them apart at a glance. Clipped sources become wiki articles, get cross-linked, and get indexed like any other \`raw/\` file. The clipper is just a fast way to get web content in.`);
  }

  return sections.length > 0 ? sections.join("\n") + "\n" : "";
}

function queryExamplesFor(mode: WikillmConfig["mode"], domain: string | undefined): string {
  if (domain) {
    return `- "What are the main concepts in ${domain}?"
- "How does X relate to Y in the context of ${domain}?"
- "What's the current best practice for Z?"`;
  }

  if (mode === "personal") {
    return `- "What was that paper I read about transformers last month?"
- "Summarize everything I've saved on a given topic"
- "What connections exist between these two concepts?"`;
  }

  return `- "How does this library's routing work?"
- "What does endpoint X return — the shape, not just the prose?"
- "Why did we choose approach A over approach B?"
- "What's the difference between these two similar APIs?"`;
}

function commitRulesFor(mode: WikillmConfig["mode"]): string {
  switch (mode) {
    case "personal":
      return `**Always \`git commit\` after every operation batch.** You're solo — push freely.`;
    case "project-solo":
      return `**Always \`git commit\` after every operation batch.** One commit per source file on ingest; one commit per lint fix batch. Push freely.`;
    case "project-team":
      return `**Pull before ingesting, commit with attribution, coordinate pushes.** Team mode means parallel ingest runs can conflict. Pull \`main\`, ingest, review, commit with a clear message, push.`;
  }
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
