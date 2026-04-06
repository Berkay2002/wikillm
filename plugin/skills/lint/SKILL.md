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
