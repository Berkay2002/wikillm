---
name: query
description: Use this skill when answering questions against a wikillm knowledge base. Covers finding relevant articles, synthesizing answers, choosing output formats (conversation, report, slides, visualization), and filing valuable results back into the wiki. Use whenever the user asks a question about their KB content or requests analysis.
---

# Query

Answer questions and perform analysis against the knowledge base.

## Preamble

1. Read the CLAUDE.md in the vault root to understand the directory structure, conventions, mode, and enabled features.
2. **Check whether Obsidian is running** — run `obsidian vaults`. If it succeeds, prefer `/wikillm:obsidian-cli` for search and graph queries. If it errors or hangs, Obsidian is closed — fall back to Grep/Glob. Do **not** rely on `obsidian --version` for this check; it succeeds when the binary is installed even if the app is closed.
3. **In multi-vault setups**, scope every CLI call with `vault="<name>"`. Run `obsidian vaults verbose` to list available vaults.
4. Read `wiki/_index/INDEX.md` next — it's the lookup table for everything that follows.

## 1. Find Relevant Articles

**Prefer direct reads when INDEX pins the answer.** If INDEX.md lists ≤2 articles that clearly cover the question, skip search — `Read` them directly. Search is strictly more round-trips for targeted lookups, and INDEX is already a curated lookup table.

**Search when INDEX is ambiguous.** When the question is cross-cutting, vague, or mentions a term that isn't an article title, use `obsidian search query="<term>"` (or Grep when Obsidian is closed).

**Scope searches to `wiki/` to cut raw/ noise:** `obsidian search` returns matches from both `raw/` (immutable source material) and `wiki/` (compiled articles) indistinguishably. The `raw/` folder is the *input* to the wiki — don't pull facts from it directly. Filter at the CLI level:

```bash
obsidian search query="<term>" path="wiki"
```

**Use tags for thematic questions.** Read `wiki/_index/TAGS.md` to find articles by topic tags when the question is thematic ("what do we know about streaming?").

## 2. Traverse the Graph

Once you've identified your primary targets, **run backlinks on each to catch hub articles you'd otherwise miss**:

```bash
obsidian backlinks file="<primary-article>"
```

Hub articles (the ones multiple other articles link to) often contain the canonical framing, the cross-cutting gotchas, or the comparison tables that make an answer feel complete. They frequently aren't obvious from INDEX browsing — the INDEX lists every article equally, but the graph tells you which ones are load-bearing.

Also useful:

- `obsidian links file="<article>"` — what the article links out to (forward graph)
- `obsidian unresolved` — broken wikilinks worth flagging as gaps

**Graph traversal is the single biggest advantage of querying Obsidian over flat-markdown grep.** If you skip this step, you're leaving information on the table. Don't skip it — the whole point of keeping the wiki in Obsidian is the graph.

## 3. Read and Synthesize

1. Read the relevant wiki articles (NOT `raw/` — the wiki is the compiled knowledge)
2. Follow `[[wikilinks]]` to related articles for additional context
3. Synthesize an answer drawing from multiple articles
4. Cite which articles informed the answer, and briefly say how you found them (INDEX lookup, search, backlink traversal) — this makes your reasoning auditable for the user

## 4. Choose Output Format

Based on the question and enabled features (check CLAUDE.md):

- **Simple answer** → respond in conversation
- **Structured analysis or likely to be re-referenced** → write to `outputs/reports/YYYY-MM-DD-topic.md`. If the answer will inform upcoming code changes or be shared with other sessions, write the report — don't rely on chat scrollback.
- **Presentation** → invoke `/wikillm:marp-cli` and write to `outputs/slides/YYYY-MM-DD-topic.md`
- **Data visualization** → write Python script, generate chart to `outputs/visualizations/YYYY-MM-DD-topic.png`

Only use output formats that are enabled in the vault's CLAUDE.md.

## 5. File Back Into Wiki

**Most queries should NOT file back.** Pure lookups — "what's the shape of this API?" — don't produce new knowledge; they just surface what's already written. Filing back on every read creates update churn and stale RECENT.md entries for no gain.

File back only when the query produces *genuine synthesis value*:

- The question exposed a contradiction between existing articles
- The query revealed a connection no existing article captures
- The answer is a comparison, trade-off, or decision worth preserving for a future session
- You verified a `[unverified]` claim and can remove the marker
- The query surfaced a hub article that deserves better placement in INDEX.md

When filing back:

1. Create or update wiki articles with the new knowledge
2. Update indices (INDEX.md, TAGS.md, RECENT.md)
3. Append to LOG.md: `## [YYYY-MM-DD HH:MM] query | <topic>`
4. Git commit: `query: <topic> — added/updated N articles`

## 6. Note Gaps

If the question reveals a gap in the KB (topic not covered, outdated info, unresolved wikilink referenced repeatedly):

1. Log it: append to LOG.md with `[gap]` marker
2. Suggest the user add sources to `raw/` to fill the gap
3. If multiple articles reference an unresolved concept, consider creating a stub (see `/wikillm:lint` section 2.4)
