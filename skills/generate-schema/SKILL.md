---
name: generate-schema
description: >-
  Generate a tailored host schema for a wikillm knowledge base when the user explicitly wants to regenerate their KB schema. Mirrors the schema written by `npx wikillm init`; accepts mode (personal/project-solo/project-team), enabled features, KB name, vault path, host targets, and optional domain context as arguments.
---

# Generate Schema

Generate `CLAUDE.md` for Claude Code, `AGENTS.md` for Codex, or both. The file tells the selected agent host how to operate a wikillm knowledge base.

## Arguments

Parse from $ARGUMENTS. Expected format:
```
--name <kb-name> --mode <personal|project-solo|project-team> --path <vault-path> --features <comma-separated> [--hosts <claude,codex>] [--domain <context>]
```

Example:
```
/wikillm:generate-schema --name research --mode personal --path ~/.wikillm/research --features slides,reports,web-clipper --hosts claude,codex --domain "machine learning and AI research"
```

## Instructions

Generate a complete host schema file and write it to `<vault-path>/CLAUDE.md`, `<vault-path>/AGENTS.md`, or both depending on `--hosts`. If `--hosts` is omitted, default to `claude` for backwards compatibility. The file must be a coherent, natural-reading document — not a template with conditional blocks.

### Required Sections

1. **Title and Philosophy** — what this KB is and how it works
2. **Directory Structure** — the vault layout (varies by mode and features)
3. **Automation** — scheduling rules (varies by mode)
4. **Ingestion** — how raw/ files are processed (reference `/wikillm:ingest` for Claude Code or `$wikillm:ingest` for Codex)
5. **Query** — how to answer questions (reference `/wikillm:query` for Claude Code or `$wikillm:query` for Codex)
6. **Wiki Conventions** — article format, naming, linking, frontmatter
7. **Index System** — INDEX.md, TAGS.md, SOURCES.md, RECENT.md, LOG.md formats
8. **Rules** — immutability of raw/, wiki ownership, commit workflow

### Host-Specific Worker Notes

When describing bulk ingest, distinguish the host behavior:

- Claude Code can dispatch the bundled `agents/ingest-worker.md` subagent definition.
- Codex plugins install skills, but do not automatically register `agents/ingest-worker.md` as a Codex custom agent. Codex bulk ingest should explicitly spawn subagents using the prompt reference at `skills/ingest/references/ingest-worker.md`.
- Codex automations can invoke `$wikillm:ingest`, but if scheduled runs should parallelize, the automation prompt must explicitly say to spawn one subagent per new source and reconcile after all workers finish.

### Mode Variations

**Personal:**
- Philosophy: "This is your brain extension — a persistent, compounding knowledge artifact."
- Tone: informal, personal notes
- Automation: guidance is recorded in `.wikillm/automation.json`; the user configures Claude Desktop or Codex to run the recorded commands
- Query focus: general knowledge synthesis
- Commit rules: solo, push freely

**Project Solo:**
- Philosophy: "This knowledge base is your project's compiled understanding."
- Tone: technical, architectural
- Automation: same as personal
- Query focus: "Why is the code like this?", architecture decisions, domain knowledge
- Commit rules: solo, push freely

**Project Team:**
- Philosophy: "This is the team's shared knowledge base — compiled understanding that everyone reads."
- Tone: clear enough for any team member
- Automation: "Manual only — run the ingest skill after adding sources. No automation guidance in team mode."
- Query focus: onboarding context, architecture decisions, "ask the wiki, not Steve"
- Commit rules: attribute commits, coordinate pushes, pull before ingesting

### Feature Variations

Only include sections for enabled features:

- **slides**: add `outputs/slides/` to directory structure, add a "Slide Generation" section referencing the marp-cli skill
- **reports**: add `outputs/reports/` to directory structure, add a "Reports" section
- **visualizations**: add `outputs/visualizations/` to directory structure, add a "Visualizations" section describing matplotlib/chart workflow
- **web-clipper**: add a "Web Clipper Pipeline" section documenting Obsidian Web Clipper → `raw/` flow

If no output features are enabled, omit the `outputs/` directory entirely.

### Domain Context

If `--domain` is provided, use it to:
- Frame the philosophy section around the domain
- Suggest relevant tags in the conventions section (e.g., for "machine learning": suggest tags like `transformers`, `attention`, `fine-tuning`, `rag`, etc.)
- Include domain-relevant example queries in the Query section
- Set the right vocabulary level for the wiki tone

### Constants (always include)

These sections are the same regardless of mode:

**Wiki conventions:**
```
- Filenames: kebab-case (e.g., `attention-mechanism.md`)
- Links: always use [[wikilinks]] for cross-references
- Frontmatter: YAML on every page (created, updated, tags, sources)
- One concept per article
- Update existing articles over creating near-duplicates
- Mark uncertainty with [unverified]
```

**Article format template:**
```markdown
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

- `raw/source-file.ext` — what was drawn from this source
```

**Index formats:**
- INDEX.md: content catalog, every page with link + one-line summary, by category
- TAGS.md: all tags with links to articles using each tag
- SOURCES.md: maps each raw/ file to wiki articles it informed
- RECENT.md: last 20 changed articles
- LOG.md: chronological record with format `## [YYYY-MM-DD HH:MM] operation | Title`

**Rules:**
- raw/ is immutable — never delete or edit source files
- Wiki is LLM-owned — the human reads, the LLM writes
- Always update indices and log after wiki changes
- Commit according to the vault mode after every operation batch
- Use [[wikilinks]] for all cross-references

### Keep The Schema Lean

The generated schema is loaded into agent context whenever the vault is in scope. Long schema files eat budget that should be spent on actual work. Aim for **under 200 lines**, and put the most critical information in the first 10-15 lines so a fast-path session can decide how to proceed without reading the rest.

**Lead with a "Query-critical summary" block** — 4-6 bullets covering facts a query session absolutely must know before touching the vault. These should be the things that, if ignored, would cause the session to produce a wrong answer or edit the wrong file:

- Where the wiki lives (`wiki/`) vs where raw sources live (`raw/`)
- That `raw/` is immutable input, `wiki/` is the compiled synthesis to read
- That all cross-references use `[[wikilinks]]` and YAML frontmatter is required
- That indices live in `wiki/_index/` and must be updated after any wiki change
- Any domain-specific gotcha unique to this KB (e.g., "this KB covers third-party libraries only, not project code")
- The canonical entry point for queries (INDEX.md → Read, then `obsidian backlinks` to catch hubs)

Example opening:

```markdown
# {{KB name}}

**Query-critical summary:**

- Compiled knowledge lives in `wiki/`. Source material lives in `raw/` (immutable — never edit).
- All articles use `[[wikilinks]]` for cross-references and YAML frontmatter (`created`, `updated`, `tags`, `sources`).
- Indices (INDEX, TAGS, SOURCES, RECENT, LOG) live in `wiki/_index/` and must be updated after any wiki write.
- For queries: start from `wiki/_index/INDEX.md`, Read the pinned articles directly, then run `obsidian backlinks` on each to catch hub articles. Never pull facts from `raw/`.
- {{domain-specific gotcha, if any}}

## Philosophy
...
```

The rest of the schema (directory structure, automation, conventions, rules) follows as reference material. The query-critical block lets sessions that just need to answer a question short-circuit reading the whole file.

### Output

Write the generated schema file(s) to the vault path. Confirm each file written, for example: "Generated CLAUDE.md at <path>" and "Generated AGENTS.md at <path>."
