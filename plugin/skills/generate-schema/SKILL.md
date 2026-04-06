---
name: generate-schema
description: Generate a tailored CLAUDE.md for a wikillm knowledge base. Use during init or when the user wants to regenerate their KB schema. Accepts mode (personal/project-solo/project-team), enabled features, KB name, vault path, and optional domain context as arguments.
---

# Generate Schema

Generate a CLAUDE.md that tells Claude Code how to operate a wikillm knowledge base.

## Arguments

Parse from $ARGUMENTS. Expected format:
```
--name <kb-name> --mode <personal|project-solo|project-team> --path <vault-path> --features <comma-separated> [--domain <context>]
```

Example:
```
/wikillm:generate-schema --name research --mode personal --path ~/.wikillm/research --features slides,reports,web-clipper --domain "machine learning and AI research"
```

## Instructions

Generate a complete CLAUDE.md file and write it to `<vault-path>/CLAUDE.md`. The file must be a coherent, natural-reading document — not a template with conditional blocks.

### Required Sections

1. **Title and Philosophy** — what this KB is and how it works
2. **Directory Structure** — the vault layout (varies by mode and features)
3. **Automation** — scheduling rules (varies by mode)
4. **Ingestion** — how raw/ files are processed (reference `/wikillm:ingest`)
5. **Query** — how to answer questions (reference `/wikillm:query`)
6. **Wiki Conventions** — article format, naming, linking, frontmatter
7. **Index System** — INDEX.md, TAGS.md, SOURCES.md, RECENT.md, LOG.md formats
8. **Rules** — immutability of raw/, wiki ownership, commit workflow

### Mode Variations

**Personal:**
- Philosophy: "This is your brain extension — a persistent, compounding knowledge artifact."
- Tone: informal, personal notes
- Automation: "Scheduled tasks run via Claude Desktop" with user's chosen frequency
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
- Automation: "Manual only — run `/wikillm:ingest` after adding sources. No scheduled automation in team mode."
- Query focus: onboarding context, architecture decisions, "ask the wiki, not Steve"
- Commit rules: attribute commits, coordinate pushes, pull before ingesting

### Feature Variations

Only include sections for enabled features:

- **slides**: add `outputs/slides/` to directory structure, add a "Slide Generation" section referencing `/wikillm:marp-cli`
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
- Always git commit + push after every operation batch
- Use [[wikilinks]] for all cross-references

### Output

Write the generated CLAUDE.md to `<vault-path>/CLAUDE.md`. Confirm to the user: "Generated CLAUDE.md at <path>."
