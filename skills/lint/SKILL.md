---
name: lint
description: Use this skill when running health checks and maintenance on a wikillm knowledge base. Covers finding and fixing broken wikilinks, missing frontmatter, orphan pages, missing concept pages, missing cross-references, contradictions, and stale claims. Use whenever performing a lint pass, whether triggered by a scheduled task or a manual request.
---

# Lint

Full procedure for running health checks and maintenance on the knowledge base.

## Preamble

1. Read the CLAUDE.md in the vault root to understand the directory structure, conventions, and mode.
2. Use `/wikillm:obsidian-cli` for graph queries (orphans, unresolved links, backlinks) when Obsidian is running. Fall back to Grep/Glob when it's not.

## 1. Pre-flight Checks

- Count wiki articles (excluding `_index/` files). If fewer than 3, exit silently.
- Read CLAUDE.md for current schema and conventions.

## 2. Check Categories

Run in this priority order. Stop after 50 total fixes to avoid runaway changes.

### 2.1 Broken [[wikilinks]]

1. Use `/wikillm:obsidian-cli` — run `obsidian unresolved verbose` to find all broken links
2. For each broken link: search for likely targets (typos, renamed files) using `obsidian search`
3. If obvious match found — update the link
4. If no match — remove the link and log it

### 2.2 Missing Frontmatter

1. Read each wiki article (skip `_index/` files)
2. Required fields: `created`, `updated`, `tags`, `sources`
3. Add missing fields:
   - `created` = file creation date or today
   - `updated` = today
   - `tags` = infer from content
   - `sources` = `[]` if unknown

### 2.3 Orphan Pages

1. Use `/wikillm:obsidian-cli` — run `obsidian orphans` to find pages with no inbound links
2. For each orphan: read it, find related articles by topic/tags
3. Add [[wikilinks]] from related articles to the orphan
4. If truly unconnectable: ensure it's listed in INDEX.md

### 2.4 Missing Concept Pages

1. Use `/wikillm:obsidian-cli` — run `obsidian unresolved` to find frequently-linked but non-existent pages
2. For concepts linked 2+ times: create a stub article
3. Stub format:
```markdown
---
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [stub]
sources: []
---

# Concept Name

This is a stub article. It was referenced by [[linking-page-1]], [[linking-page-2]].

## Related

- [[related-article]]
```

### 2.5 Missing Cross-References

1. For each article: check if articles sharing 2+ tags link to each other
2. Add missing links in `## Related` sections

### 2.6 Contradictions

1. When reading articles, watch for conflicting claims about the same topic
2. Do NOT auto-resolve — append to LOG.md with `[contradiction]` tag:
```
## [YYYY-MM-DD HH:MM] lint | Contradiction found
[[article-1]] says X, [[article-2]] says Y. Needs human review.
```

### 2.7 Stale/Unverified Claims

1. Search for `[unverified]` markers across wiki
2. Use web search to verify each claim
3. If verified: update article, remove `[unverified]` tag
4. If wrong: correct the claim, note the correction in Sources section

### 2.8 Index Consistency

Every article in `wiki/` (excluding `_index/` files) must appear in both INDEX.md (with a category and one-line summary) and SOURCES.md (mapped back to its source). Drift between wiki files and indices is the #1 cause of ingest detection bugs.

1. List wiki articles: `obsidian files folder="wiki" ext=md` (or Glob `wiki/**/*.md` excluding `wiki/_index/`)
2. For each article:
   - Check it appears in `INDEX.md` under some category. If missing, add it under the best-fit category using the one-line summary format.
   - Check it appears in `SOURCES.md` mapped from its source file. Re-derive the mapping from the article's frontmatter `sources:` field if missing.
3. Conversely, any entry in INDEX.md or SOURCES.md that points to a non-existent article is stale. If the article was renamed, update the link; if it was deleted, remove the entry.
4. Check `wiki/_index/TAGS.md` coverage: every tag actually used in frontmatter across the vault should appear in TAGS.md. Run `obsidian tags format=json` to get the ground-truth tag set from Obsidian's index.

### 2.9 Hub Detection (Backlink Density)

Some articles are load-bearing hubs — they're linked from many others and contain canonical framing or cross-cutting tables. INDEX.md lists every article equally, which buries hubs. Lint should surface them.

1. For each article, count incoming backlinks: `obsidian backlinks file="<article>" total`
2. **Articles with ≥3 backlinks are hubs.** Verify they're surfaced prominently in INDEX.md (ideally first in their category, not buried at the bottom of a list). Log a reorder suggestion in LOG.md if they're not.
3. Run `obsidian unresolved counts format=json` to find non-existent concepts referenced multiple times. **Any unresolved wikilink referenced 3+ times across the wiki should become a stub article** — the KB is telling you a concept is missing. Create it using the stub format in 2.4.
4. Log hub discoveries to LOG.md:
```
## [YYYY-MM-DD HH:MM] lint | Hub discovery
[[article]] has N backlinks — promoted to top of <category> in INDEX.md
```

This check is the main reason a linter over Obsidian is more valuable than a flat-markdown linter. Don't skip it.

## 3. Thresholds

- Maximum **50 fixes** per run
- If limit reached, log which checks were incomplete in the report

## 4. Reporting

Append to LOG.md after all fixes:

```
## [YYYY-MM-DD HH:MM] lint | Health Check
Fixed N broken links, added M frontmatter fields, connected K orphans,
created J stubs, added L cross-refs. Flagged P contradictions.
Pages touched: [[page1]], [[page2]], ...
```

## 5. Index Update

After all fixes, update INDEX.md and TAGS.md to reflect any new or changed articles. Update RECENT.md with touched pages.

## 6. Git Workflow

Single commit after all fixes:
```
lint: fixed N broken links, created M stubs, added K cross-refs
```

Stage specific files, not `git add .`. Push after committing.
