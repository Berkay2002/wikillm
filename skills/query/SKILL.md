---
name: query
description: Use this skill when answering questions against a wikillm knowledge base. Covers finding relevant articles, synthesizing answers, choosing output formats (conversation, report, slides, visualization), and filing valuable results back into the wiki. Use whenever the user asks a question about their KB content or requests analysis.
---

# Query

Answer questions and perform analysis against the knowledge base.

## Preamble

1. Read the CLAUDE.md in the vault root to understand the directory structure, conventions, mode, and enabled features.
2. Use `/wikillm:obsidian-cli` for search when Obsidian is running. Fall back to Grep/Glob when it's not.

## 1. Find Relevant Articles

1. Read `wiki/_index/INDEX.md` to get an overview of all content by category
2. Identify articles likely relevant to the question
3. If the question mentions specific terms, search with `obsidian search query="<term>"` or Grep
4. Read `wiki/_index/TAGS.md` to find articles by topic tags

## 2. Read and Synthesize

1. Read the relevant wiki articles (NOT raw/ — the wiki is the compiled knowledge)
2. Follow [[wikilinks]] to related articles for additional context
3. Synthesize an answer drawing from multiple articles
4. Cite which articles informed the answer

## 3. Choose Output Format

Based on the question and enabled features (check CLAUDE.md):

- **Simple answer** → respond in conversation
- **Structured analysis** → write to `outputs/reports/YYYY-MM-DD-topic.md`
- **Presentation** → invoke `/wikillm:marp-cli` and write to `outputs/slides/YYYY-MM-DD-topic.md`
- **Data visualization** → write Python script, generate chart to `outputs/visualizations/YYYY-MM-DD-topic.png`

Only use output formats that are enabled in the vault's CLAUDE.md.

## 4. File Back Into Wiki

If the answer reveals new connections, comparisons, or insights worth preserving:

1. Create or update wiki articles with the new knowledge
2. Update indices (INDEX.md, TAGS.md, RECENT.md)
3. Append to LOG.md: `## [YYYY-MM-DD HH:MM] query | <topic>`
4. Git commit: `query: <topic> — added/updated N articles`

## 5. Note Gaps

If the question reveals a gap in the KB (topic not covered, outdated info):

1. Log it: append to LOG.md with `[gap]` marker
2. Suggest the user add sources to `raw/` to fill the gap
