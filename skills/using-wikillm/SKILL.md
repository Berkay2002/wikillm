---
name: using-wikillm
description: Use whenever a project has a `.kb/` folder (that's a wikillm knowledge base), when the user mentions wikillm, `npx wikillm`, or a knowledge-base query/ingest/lint task, or when the user asks how to integrate a KB into their existing project. Establishes the wikillm workflow, names all six skills (query, ingest, lint, obsidian-cli, marp-cli, generate-schema), explains when to use each, and shows how to wire a KB into a project's existing root `CLAUDE.md` without touching the project's own instructions.
---

<EXTREMELY-IMPORTANT>
If a project has a `.kb/` folder, it is a wikillm knowledge base. Prefer `/wikillm:query` over grepping `.kb/raw/` by hand — the wiki has already done the synthesis work, and re-reading raw sources on every question defeats the whole point of having a compiled wiki.
</EXTREMELY-IMPORTANT>

# Using wikillm

wikillm turns a folder of raw sources into a cross-referenced Obsidian wiki that Claude Code maintains for you. You drop articles, PDFs, blog posts, or API specs into `raw/`. Claude compiles them into wiki articles, cross-links them, flags contradictions, and keeps the indices current. From then on you query the wiki — not the raw sources — because the synthesis has already been done.

**This is not RAG.** There are no embeddings, no vector stores, no retrieval at query time. The wiki is compiled once into plain markdown and kept current via ingest + lint runs. When you ask a question, you're reading a pre-written article, not re-deriving the answer from raw text. That's why wikillm is fast and why its answers are consistent: the hard work happens at ingest time, not query time.

## Detecting a wikillm KB

Before reaching for grep, find, or the Read tool on a docs folder, check whether a KB already exists:

1. **Project KB** — look for `.kb/` at the repo root. If it has a `raw/` and `wiki/` subfolder, it's a wikillm vault.
2. **Personal KB** — look for `~/.wikillm/<name>/` on the user's machine.
3. **Vault schema** — either kind will contain a `CLAUDE.md` at its root (e.g. `.kb/CLAUDE.md`). Read it first — it's the vault-specific rules: naming conventions, tag vocabulary, automation schedule, and anything the user customized.

If you find a KB, you're expected to use `/wikillm:query` for reference lookups. Grepping `.kb/raw/` by hand is almost always the wrong move — the wiki exists precisely to save you from that.

## The six wikillm skills

| Skill | When to invoke |
|---|---|
| `/wikillm:query` | **Default for reference lookups.** Use for "how does X work", "what does endpoint Y return", "why did we choose Z", and any other question you'd otherwise answer by reading docs. Chooses its own output format — inline answer, structured report, slide deck, or visualization — and files valuable results back into the wiki. |
| `/wikillm:ingest` | When new files are in `.kb/raw/` that haven't been compiled yet. Detects unprocessed files via `SOURCES.md`, extracts concepts, writes or updates articles, cross-links, updates all four indices, and commits. Dispatches parallel workers for 3+ sources. |
| `/wikillm:lint` | Health check: broken wikilinks, orphan pages, missing frontmatter, missing concept pages, missing cross-references, contradictions, stale claims. Run it periodically, or when the user reports "the wiki is off" or "search is giving me weird results". |
| `/wikillm:obsidian-cli` | Search, read, write, or graph-query the vault programmatically when the Obsidian desktop app is running. Preferred over Read/Write/Grep for vault operations because it keeps Obsidian's indexed search, graph, and plugins in sync. Falls back to direct file tools when Obsidian isn't running. |
| `/wikillm:marp-cli` | Generate slide decks (`.pdf`, `.pptx`, `.html`) from wiki content. Use when the user asks for a presentation, deck, walkthrough, or visual summary of a topic. |
| `/wikillm:generate-schema` | Regenerate a vault's `CLAUDE.md` (the vault schema, not the project root). Only use if the user explicitly asks to rebuild their KB schema — the one `npx wikillm init` wrote is normally fine. |

## The `npx wikillm` CLI

When a project doesn't have a KB yet and the user wants to set one up, they run `npx wikillm`. It's an interactive wizard:

1. Asks for a KB name, kind (personal / project), mode (solo / team), features, and optional domain
2. Checks dependencies — Claude Code, Obsidian, optionally Marp
3. Scaffolds the vault folder structure: `raw/`, `wiki/_index/`, `outputs/`, `.obsidian/`
4. Writes `<vault>/CLAUDE.md` — the vault schema, which includes directory layout, conventions, index formats, and mode-specific rules
5. Prints a next-steps block with exactly what to do after the wizard exits

**Crucial: `npx wikillm` never touches the project's own root `CLAUDE.md`.** The vault's schema lives at `.kb/CLAUDE.md` and is scoped to the KB. The project's `CLAUDE.md` at the repo root is the user's — wikillm stays out of it. See the integration section below for how to wire the two together manually.

Other CLI commands:
- `npx wikillm doctor` — check dependencies and vault health
- `npx wikillm update` — update the plugin to latest

## Integrating a KB with the project's root `CLAUDE.md`

After `npx wikillm` sets up `.kb/`, the project's root `CLAUDE.md` needs one thing: a short pointer so future Claude Code sessions know the KB exists and how to use it. This is a manual edit — wikillm never does it for you, because the project root `CLAUDE.md` belongs to the user and overwriting it would destroy their own instructions.

Append a section like this to the project's existing `CLAUDE.md`:

```markdown
## Knowledge Base

This project has a wikillm knowledge base at `.kb/`. Third-party reference material (library docs, API specs, framework guides) is compiled into a cross-referenced wiki at `.kb/wiki/`. Raw sources live in `.kb/raw/`.

- **To answer questions about the stack**, use `/wikillm:query` instead of grepping `.kb/raw/` by hand — the wiki has already synthesized the material.
- **To add new reference material**, drop files in `.kb/raw/` and run `/wikillm:ingest`.
- **To check wiki health**, run `/wikillm:lint`.
- See `.kb/CLAUDE.md` for the vault's own conventions and rules.
```

That's the baseline. If the project has specific constraints, add them in a second paragraph:

- If the KB is dev-time-only (no runtime dependency on `.kb/`), say so explicitly — otherwise a future agent might try to import from it.
- If certain docs folders are *not* in the KB (e.g. internal specs still live in `docs/`), mention that so agents don't look for them in the wrong place.
- If the team has a rule like "always commit raw sources, never commit the compiled wiki", put it here.

## Red flags

These thoughts mean STOP — you're rationalizing your way out of using the KB:

| Thought | Reality |
|---|---|
| "I'll just grep `.kb/raw/` directly, it'll be faster" | The wiki is the synthesis. Grepping raw sources duplicates the compile work and you'll miss cross-references. Use `/wikillm:query`. |
| "It's a simple question, the skill is overkill" | `/wikillm:query` is fast for simple questions too, and every query teaches you the wiki's shape for the next one. |
| "The wiki might be stale" | It might. Run `/wikillm:lint` and then query. Don't silently fall back to raw sources — if the wiki is wrong, fix it. |
| "I'll write a new wiki article myself" | Don't. The wiki is LLM-owned: drop the source in `.kb/raw/` and run `/wikillm:ingest`. Hand-edits break ingest detection and leave the indices inconsistent. |
| "I'll dump this reference doc into the project `CLAUDE.md`" | Reference material goes in `.kb/raw/`, not the project `CLAUDE.md`. The project `CLAUDE.md` is for *instructions*, not library docs. |
| "The project doesn't have a KB, so I can't use wikillm" | Check with the user — `npx wikillm` takes 60 seconds and is the right move if they'll be asking the same docs questions repeatedly. |
| "I know what's in the wiki already" | Wikis evolve. Every ingest can rewrite or reorganize articles. Query instead of recalling. |

## When NOT to use a wikillm KB

- **Runtime code.** A wikillm KB is dev-time tooling for Claude Code sessions working on a codebase. Don't import from `.kb/` at runtime, don't ship it with your app, don't read it from production code paths. It's scaffolding, not infrastructure.
- **The project's own source code or specs.** The wiki is for *third-party reference material* — libraries, APIs, frameworks, external docs. Your own code is self-documenting (or should be). Specs, plans, decision records, and process docs belong somewhere else (typically `docs/` outside `.kb/`), because they're authored by humans and the wiki is LLM-owned.
- **Secrets, credentials, or personal data.** Never ingest files containing API keys, tokens, passwords, or PII. The wiki is plain markdown and often committed to git.
- **Frequently-changing live data.** The wiki is a point-in-time synthesis. For live status, metrics, or operational dashboards, use the source of truth directly — don't compile a wiki article that'll be stale in an hour.

## First-time setup checklist

If the user is setting up a wikillm KB for the first time:

1. Run `npx wikillm` and answer the wizard prompts.
2. Verify `.kb/CLAUDE.md` exists and is non-empty. If not, invoke `/wikillm:generate-schema` directly and point it at the vault path — the init step shells out to a subprocess that can silently fail.
3. Drop the first batch of sources into `.kb/raw/`. Keep the folder structure under `raw/` meaningful (e.g. `raw/langchain/`, `raw/api-specs/`) — it makes later lookups easier.
4. Run `/wikillm:ingest` to compile them. For bulk imports, this will dispatch parallel workers and produce one commit per source file.
5. Append the "Knowledge Base" pointer block (see above) to the project's root `CLAUDE.md`.
6. Smoke test with `/wikillm:query` — ask a question you already know the answer to, make sure the wiki gets it right. If it doesn't, run `/wikillm:lint` and investigate.

## Mental model

The most useful way to think about a wikillm KB: it's your project's **compiled understanding** of its third-party stack, written once and kept current, so that future Claude sessions don't have to re-learn the same docs from scratch every time. The ingest pipeline is the "compile step". The query skill is the "runtime". Lint is the "type checker". If you've ever built a project with a compile step, the instincts transfer directly.
