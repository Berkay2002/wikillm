---
name: lint
description: Use this skill when running health checks and maintenance on a wikillm knowledge base. Covers finding and fixing broken wikilinks, missing frontmatter, orphan pages, missing concept pages, missing cross-references, contradictions, stale claims, disconnected graph clusters, and near-duplicate articles. Use whenever performing a lint pass, whether triggered by a scheduled task or a manual request.
---

# Lint

Full procedure for running health checks and maintenance on the knowledge base.

## Preamble

1. Read the CLAUDE.md in the vault root to understand the directory structure, conventions, and mode.
2. Use `/wikillm:obsidian-cli` for graph queries (orphans, unresolved links, backlinks) when Obsidian is running. Fall back to Grep/Glob when it's not.
3. **Read §2.0 Scoping Conventions before running any check.** Every graph query needs to be filtered — raw results include `raw/` source-material noise and `_index/` auto-references that mask real problems.

## 1. Pre-flight Checks

- Count wiki articles (excluding `_index/` files). If fewer than 3, exit silently.
- Read CLAUDE.md for current schema and conventions.

## 2. Check Categories

Run in this priority order. Stop after 50 total fixes to avoid runaway changes.

### 2.0 Scoping Conventions

The Obsidian graph includes **every** markdown file in the vault — raw sources, wiki articles, and the `_index/` administrative files. All of them produce noise in the graph commands unless you filter them out. Use these definitions consistently across every subsection below:

- **Wiki article** = a file matching `wiki/*.md` but *not* `wiki/_index/**`. This is the set lint operates on. Everything else is either immutable source material or administrative bookkeeping.
- **Wiki-side unresolved link** = an unresolved wikilink whose *source file* is in `wiki/` (not `raw/`). Broken links inside `raw/` source material are **false positives** — `raw/` is immutable and typically references external doc-site paths that were never meant to resolve. Ignore them.
- **Real backlink count** = backlinks to a file excluding anything from `wiki/_index/**`. The index files (INDEX, TAGS, SOURCES, RECENT, LOG) reference nearly every article, which inflates raw `obsidian backlinks total` by 4–5 for every file. Thresholds in this skill ("orphan", "near-orphan", "hub") always mean **real** backlinks. Use:
  ```bash
  obsidian backlinks file="$name" | grep -v "_index/" | grep -c "wiki/"
  ```
  for the real count. Never use `obsidian backlinks total` directly for threshold decisions.
- **Real orphan** = a wiki article with 0 real backlinks. `obsidian orphans` alone is **not** sufficient — it considers any inbound edge including `_index/` auto-references, so it will report 0 orphans on a healthy-looking vault that actually has several isolated articles.

Run every graph query through these filters. A lint pass that skips scoping will flag 70+ false positives on a typical vault.

### 2.1 Broken [[wikilinks]]

1. Use `/wikillm:obsidian-cli` — run `obsidian unresolved verbose` to find all broken links.
2. **Filter to wiki-side unresolved only.** The third column of `unresolved verbose` lists the source files referencing each broken target. Drop any row whose source files are all in `raw/` — those are immutable and out of scope. Only act on rows with at least one `wiki/` source.
3. For each remaining broken link: search for likely targets (typos, renamed files) using `obsidian search query="<term>" path="wiki"`.
4. If obvious match found — update the link.
5. If no match and the link is referenced 1 time — unlink it (convert to plain text) and log it.
6. If no match and the link is referenced 2+ times — promote to §2.4 (create a stub).

### 2.2 Missing Frontmatter

1. Read each wiki article (skip `_index/` files).
2. Required fields: `created`, `updated`, `tags`, `sources`.
3. Add missing fields:
   - `created` = file creation date or today
   - `updated` = today
   - `tags` = infer from content
   - `sources` = `[]` if unknown

### 2.3 Orphan and Near-Orphan Pages

Run these counts using the **real backlink** definition from §2.0 — the `obsidian orphans` command alone will miss orphans masked by `_index/` auto-references.

1. For each wiki article, compute its real backlink count:
   ```bash
   for f in wiki/*.md; do
     name=$(basename "$f" .md)
     [ "$name" = "_index" ] && continue
     count=$(obsidian backlinks file="$name" 2>/dev/null | grep -v "_index/" | grep -c "wiki/")
     echo "$count $name"
   done | sort -n
   ```
2. **Real orphans (0 backlinks)** — read the article, find related articles by topic or shared tags, add [[wikilinks]] from the related articles *to* the orphan. If truly unconnectable, ensure it's listed in INDEX.md under the best-fit category.
3. **Near-orphans (exactly 1 backlink)** — these are articles hanging off a single thread, often from only one topical neighbor. Find one more natural anchor point and add a backlink. A healthy wiki has ≥2 real backlinks per article.
4. Do **not** use `obsidian orphans` as the primary signal — it treats `_index/` references as real inbound and returns `raw/` files alongside wiki articles. Use it only as a cross-check.

### 2.4 Missing Concept Pages

1. Use `/wikillm:obsidian-cli` — run `obsidian unresolved counts format=json` to find frequently-linked non-existent pages.
2. **Filter to wiki-side references only** (see §2.0). External doc-site paths from `raw/` files are noise.
3. For wiki-side concepts linked 2+ times: create a stub article.
4. Stub format:
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

Operationalize this as a bounded check — avoid O(n²) sweeps on large vaults.

1. Run `obsidian tags format=json` to get the tag → articles mapping.
2. For each tag with 3+ articles: verify each article in that tag group is reachable from at least one other article in the group via a direct wikilink. If an article shares a tag with 3+ others but has 0 links to or from any of them, flag it for a `## Related` addition.
3. Add missing links in `## Related` sections on the under-connected side.
4. Skip generic tags (`reference`, `overview`, `stub`) — they capture documents with nothing thematic in common.

### 2.6 Contradictions

1. When reading articles, watch for conflicting claims about the same topic.
2. Do NOT auto-resolve — append to LOG.md with `[contradiction]` tag:
```
## [YYYY-MM-DD HH:MM] lint | Contradiction found
[[article-1]] says X, [[article-2]] says Y. Needs human review.
```

### 2.7 Stale/Unverified Claims

1. Search for `[unverified]` markers across wiki.
2. Use web search to verify each claim.
3. If verified: update article, remove `[unverified]` tag.
4. If wrong: correct the claim, note the correction in Sources section.

### 2.8 Index Consistency

Every article in `wiki/` (excluding `_index/` files) must appear in both INDEX.md (with a category and one-line summary) and SOURCES.md (mapped back to its source). Drift between wiki files and indices is the #1 cause of ingest detection bugs.

1. List wiki articles: `obsidian files folder="wiki" ext=md` (or Glob `wiki/**/*.md` excluding `wiki/_index/`).
2. For each article:
   - Check it appears in `INDEX.md` under some category. If missing, add it under the best-fit category using the one-line summary format.
   - Check it appears in `SOURCES.md` mapped from its source file. Re-derive the mapping from the article's frontmatter `sources:` field if missing.
3. Conversely, any entry in INDEX.md or SOURCES.md that points to a non-existent article is stale. If the article was renamed, update the link; if it was deleted, remove the entry.
4. Check `wiki/_index/TAGS.md` coverage: every tag actually used in frontmatter across the vault should appear in TAGS.md. Run `obsidian tags format=json` to get the ground-truth tag set from Obsidian's index.

### 2.9 Hub Detection (Backlink Density)

Some articles are load-bearing hubs — they're linked from many others and contain canonical framing or cross-cutting tables. INDEX.md lists every article equally, which buries hubs. Lint should surface them.

1. Compute the **real backlink count** for every article per §2.0 (exclude `_index/`).
2. **Articles with ≥3 real backlinks are hubs.** Verify they're surfaced prominently in INDEX.md (ideally first in their category, not buried at the bottom of a list). Log a reorder suggestion in LOG.md if they're not. (Using the raw `obsidian backlinks total` here is wrong — every article has 4–5 auto-references from the index files, so every article would falsely qualify as a hub.)
3. Run `obsidian unresolved counts format=json` to find non-existent concepts referenced multiple times by wiki articles (per §2.0 filtering). **Any wiki-side unresolved wikilink referenced 3+ times should become a stub article** — the KB is telling you a concept is missing. Create it using the stub format in §2.4.
4. Log hub discoveries to LOG.md:
```
## [YYYY-MM-DD HH:MM] lint | Hub discovery
[[article]] has N real backlinks — promoted to top of <category> in INDEX.md
```

This check is the main reason a linter over Obsidian is more valuable than a flat-markdown linter. Don't skip it.

### 2.10 Graph Connectivity (Connected Components)

An article can have multiple backlinks and still sit in a disconnected island — §2.3 and §2.9 won't catch this because they only count per-node degree, not whole-graph reachability. Obsidian's graph view is the fastest way to spot the failure mode: two or more visually distinct clumps with no edges between them.

A healthy wiki is one weakly-connected component. Two or more components means users browsing the graph will land in an island and never traverse to the rest of the knowledge base.

1. Build the undirected wiki link graph from the output of `obsidian links file=<name>` for every wiki article (excluding `_index/`). For each article, collect its outbound links that resolve to other wiki articles — that forms the adjacency list.
2. Flood-fill from any starting article. The set of reached nodes is one connected component. Any unreached articles form additional components.
3. **If more than one component exists:** log every component with its article count and sample members. The largest component is the "main island"; the rest are disconnected.
4. For each disconnected component, identify the 1–2 articles most topically related to the main island (usually by shared tags or shared `sources:` prefix) and add bridging `[[wikilinks]]` on both sides. One strong bridge is better than five weak ones — pick an anchor in each cluster that genuinely cites the other.
5. Log the fix:
```
## [YYYY-MM-DD HH:MM] lint | Cluster bridge
Merged component with N articles into main island via [[article-a]] <-> [[article-b]]
```

Skip this check on vaults with fewer than 20 wiki articles — the graph is too sparse for connectivity to be meaningful.

### 2.11 Duplicate / Near-Duplicate Audit

Ingest runs can produce near-duplicate articles when two source files describe the same concept or when a second pass fails to update an existing article and creates a new one instead. Duplicates rot the KB — queries return inconsistent answers depending on which duplicate wins the search.

1. **Shared-source groups.** For each `raw/` source file, list the wiki articles whose frontmatter `sources:` field references it. Groups of 2+ are candidates for inspection. Read the H1 and first paragraph of each article in the group side by side.
2. **Apply the split-versus-duplicate test.** A legitimate split is "one concept per article, each distinct" (e.g., `backends` overview + `composite-backend` specific type). A duplicate is two articles covering the same concept with different phrasing or coverage depth.
3. **Near-duplicate heuristic.** Two articles are candidates if any of:
   - H1 titles are identical modulo casing/pluralization.
   - They share the same top 3 tags AND share at least one `sources:` entry.
   - Their outbound-link sets overlap by ≥70% (Jaccard similarity).
4. **Do not auto-merge.** Append a finding to LOG.md under a `[duplicate-candidate]` tag and let the human decide:
```
## [YYYY-MM-DD HH:MM] lint | Duplicate candidate
[[article-a]] and [[article-b]] share source `raw/path.md` and cover the same concept. Suggested action: merge [[article-b]] into [[article-a]], redirect any inbound links, and delete [[article-b]].
```
5. If an article is a pure subset of another (one is the overview, one is a single section hoisted out), leave them alone — that's a legitimate progressive-disclosure split.

## 3. Thresholds

- Maximum **50 fixes** per run
- If limit reached, log which checks were incomplete in the report

## 4. Verification Before Reporting

Before writing the LOG entry, re-run the same queries to confirm the fixes actually landed. It is easy to claim "fixed N broken links" when the numbers didn't actually move — the LOG is the source of truth for health-check history and needs to be accurate.

1. **Re-run `obsidian unresolved verbose`** and confirm the count of wiki-side unresolved links is lower by the number you claim to have fixed.
2. **Re-run the real-backlink count loop** from §2.3 and confirm zero-backlink and near-orphan counts dropped by the number you claim to have connected.
3. **Re-run `obsidian search query="[stub]" path="wiki"`** (or similar) to confirm newly created stubs are present.
4. **Re-run the flood-fill from §2.10** if you added bridges, and confirm the component count is now 1 (or at least lower).

If any verification step disagrees with your intended fix, diagnose before writing the LOG — never write a claim you haven't verified.

## 5. Reporting

Append to LOG.md after verification passes:

```
## [YYYY-MM-DD HH:MM] lint | Health Check
Fixed N broken links, added M frontmatter fields, connected K orphans,
bridged J disconnected components, created S stubs, added L cross-refs.
Flagged P contradictions, D duplicate candidates.
Pages touched: [[page1]], [[page2]], ...
```

## 6. Index Update

After all fixes, update INDEX.md and TAGS.md to reflect any new or changed articles. Update RECENT.md with touched pages.

## 7. Git Workflow

Single commit after all fixes:
```
lint: fixed N broken links, created M stubs, added K cross-refs
```

Stage specific files, not `git add .`. Push after committing.

**CRLF/LF warnings on Windows.** `git status` may show files under `raw/` as modified (`M`) even though lint never touched them — the warning is just line-ending normalization and there is no content diff. Before staging, run `git diff --stat` and skip any file showing `0 insertions(+), 0 deletions(-)`. Never stage `raw/` files in a lint commit: `raw/` is immutable per the KB rules and any real content change there belongs in a separate ingest pipeline fix.
