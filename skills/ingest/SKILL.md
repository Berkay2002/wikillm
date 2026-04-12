---
name: ingest
description: Use this skill when ingesting raw source files into a wikillm knowledge base. Covers the full ingest pipeline: detecting unprocessed files, reading and extracting knowledge, writing wiki articles, cross-linking, updating indices, and committing. Use whenever processing files from raw/ into wiki/, whether triggered by a scheduled task or a manual request.
---

# Ingest

Full procedure for ingesting raw source files into the knowledge base.

## Preamble

1. Read the CLAUDE.md in the vault root to understand the directory structure, conventions, and mode (personal/project).
2. Use `/wikillm:obsidian-cli` for search and graph operations when Obsidian is running. Fall back to Grep/Glob when it's not.

## 1. Detection

Find unprocessed files:

1. Read `wiki/_index/SOURCES.md` to get the list of already-processed filenames
2. List all files in `raw/` (excluding the `raw/assets/` directory)
3. Any file in `raw/` not listed in SOURCES.md is new
4. If no new files, exit silently

## 2. Processing Pipeline

### Dispatch strategy

Decided during pre-scan (Phase 1d). Process yourself when the workload is light; dispatch `ingest-worker` subagents when parallelism pays off.

### Sequential processing (1-2 files)

For each new file:

1. **Identify file type** and read `references/file-types.md` for type-specific handling
2. **Read the source thoroughly** — for PDFs, use chunked reading (`pages` parameter)
3. **View images** — if source contains images, read text first, then view images for additional context
4. **Identify concepts** — list all concepts, entities, and topics in the source
5. **Check existing coverage** — for each concept, check if a wiki article already exists (use `/wikillm:obsidian-cli` search or Grep)
6. **Decide action** — create new article / update existing article / skip (already well-covered)
7. **Write/update articles** following the Article Writing Guide below
8. **Cross-link** all related articles with [[wikilinks]]
9. **Write summary page** for the source itself
10. **Update indices** — INDEX.md, TAGS.md, SOURCES.md, RECENT.md
11. **Append to LOG.md**
12. **Git add, commit, push** — one commit per source file

### Parallel processing (3+ files)

#### Phase 1: Pre-scan (orchestrator)

The orchestrator reads and analyzes all new sources before dispatching. This is where the intelligence lives.

**1a. Inventory each source:**

For each new file, determine:
- **File type** — markdown, PDF, HTML clip, YouTube transcript, code, etc. (read `references/file-types.md` for handling notes)
- **Size/complexity** — page count for PDFs, line count for text, number of images
- **Topic scope** — broad survey vs deep dive on a single topic
- **Key concepts** — skim the source (intro, headings, abstract, first ~100 lines) to extract the main concepts, entities, and topics

**1b. Read current wiki state:**

- Read `wiki/_index/SOURCES.md` and `wiki/_index/INDEX.md` to know what already exists
- Identify existing articles that new sources might update

**1c. Build concept assignment table:**

- List every concept across all sources
- If a concept appears in multiple sources, assign ONE source as the **owner** (the source that covers it most deeply)
- Other sources get the concept marked as **link-only** (reference it, don't create/update the article)
- Existing wiki articles that multiple sources touch: assign one owner the same way

**1d. Decide dispatch strategy:**

Use your judgement based on the inventory. The goal is: don't spawn subagents when the orchestrator can handle it faster itself.

- **Do it yourself** when the total workload is light — e.g., 1-2 short articles, a handful of clips on familiar topics, or sources that mostly update existing articles rather than creating new ones. Subagent overhead (startup, prompt injection, reconciliation) isn't worth it for small batches.
- **Dispatch parallel workers** when there are 3+ substantive sources, or fewer sources that are each large/complex enough to justify isolation (e.g., two 100-page PDFs).
- For very large sources (200+ page PDFs), note in the worker prompt so it can chunk appropriately.

This prevents duplicate articles and gives each worker clear boundaries.

#### Phase 2: Dispatch workers

Dispatch one `ingest-worker` subagent per source file, all in parallel, each with:
- The source file path
- The current SOURCES.md + INDEX.md content
- The concept assignment table: which concepts this worker **owns** (create/update) vs **link-only** (just use [[wikilinks]])

#### Phase 3: Reconcile (orchestrator)

After ALL workers complete:

1. **Handle failures** — if a worker errored out, check what it partially wrote by grepping `wiki/` for files with that source in frontmatter `sources:` field. Either re-run that single source sequentially, or accept partial results and log the gap.
2. **Dedup check** — scan `wiki/` for any articles created by multiple workers (same filename or near-identical titles). Merge if found.
3. **Cross-link audit** — check that worker-created articles link to each other where relevant. Workers can't know about sibling workers' new articles, so add missing [[wikilinks]] now.
4. **Update indices** — INDEX.md, TAGS.md, SOURCES.md, RECENT.md from aggregated worker output (including partial results from failed workers)
5. **Append to LOG.md** — one entry per source, mark failures with `[partial]`
6. **Git commit + push** — one batch commit or one per source file

## 3. Article Writing Guide

### Structure

```markdown
---
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [tag1, tag2]
sources: [raw/filename.ext]
---

# Article Title

Brief summary (2-3 sentences).

## Content

Main content organized with headers.

## Related

- [[Related Article 1]]
- [[Related Article 2]]

## Sources

- `raw/source-file.md` — what was drawn from this source
```

### Tone and Density

- Encyclopedic but accessible. Write for your future self who has forgotten the details.
- One concept per article. If an article covers two distinct ideas, split it.
- When to split: if a section could stand alone as a useful reference, it should be its own article.
- When to merge: if two potential articles would be <3 sentences each and are tightly coupled, combine them.
- Overlapping topics: each article owns its core concept. Other articles link to it rather than re-explaining.

### Frontmatter

Required fields: `created`, `updated`, `tags`, `sources`. All wiki articles must have these.

### Project-Specific Warning Callouts

When a source contains a **counter-intuitive fact, a field named differently from convention, or a claim contradicted elsewhere**, emit an explicit warning callout block in the compiled article. Don't bury these in prose — a future query session needs to hit them on a skim, not infer them from careful reading.

Good pattern (lifted from a real Tavily Map article):

```markdown
## Response Shape

**IMPORTANT — `results`, not `urls`:** The response uses `results` for the URL array, not `urls`. This has caused bugs in multiple implementations. Do not assume the field is named `urls`.

​`​`​`json
{ "results": ["https://..."] }
​`​`​`

Then optionally pair it with a code contrast showing right vs wrong:

​`​`​`typescript
// Correct
const urls: string[] = response.results;

// Wrong — this field does not exist
const urls = response.urls; // undefined
​`​`​`
```

When to emit one:

- The source explicitly says "NOTE:", "WARNING:", "Common mistake:", or "Don't confuse this with" — lift those directly.
- A field or method name is non-obvious (e.g., `results` instead of the expected `urls`; `failed_results` returned alongside `results` without throwing).
- A default value is surprising or easy to misuse (e.g., silent truncation, soft caps on array sizes, fields present only under specific flags).
- Two sources contradict each other — call out the version you're treating as authoritative, mark the other with `[unverified]`, and link both.
- The project's root or vault `CLAUDE.md` explicitly lists a gotcha for this topic — lift it into the article and cite `CLAUDE.md` in the `Sources` section.

**A warning callout is worth 10× a buried sentence.** Err toward emitting them. They're the single highest-ROI thing ingest can produce, because they turn implicit traps into explicit ones that survive the next time a query session skims the article.

## 4. Cross-Linking Strategy

- Link on **first mention** of a concept in each article (not every mention)
- A concept deserves its own page if:
  - It's a distinct entity (person, project, paper, tool), OR
  - It's referenced in 2+ articles, OR
  - It's complex enough to need explanation
- Don't over-link: common words that happen to be article titles (e.g., "data", "model") should only be linked when referring to the specific concept
- Every article must have a `## Related` section with 2-5 links to related articles

## 5. Index Maintenance

Update all four index files after processing each source:

- **INDEX.md**: `- [[article-name]] — one-line summary` grouped by category
- **TAGS.md**: `## tag-name` with list of `[[articles]]` using that tag
- **SOURCES.md**: `- raw/filename.ext → [[summary-page]], [[article-1]], [[article-2]]`
- **RECENT.md**: Last 20 changed articles, most recent first: `- [[article]] — YYYY-MM-DD — what changed`

## 6. Git Workflow

- One commit per source file processed
- Message format: `ingest: source-name — added N new articles, updated M existing`
- Stage specific files, not `git add .`
- Push after committing

## 7. File Type Reference

For file-type-specific handling instructions (markdown, PDFs, YouTube, plain text, code), read `references/file-types.md`.
