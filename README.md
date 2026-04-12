# wikillm

LLM-maintained knowledge bases powered by Claude Code and Obsidian.

Drop sources in `raw/`, and Claude compiles them into a cross-referenced wiki — no vector stores, no embeddings, no RAG pipeline. Just markdown.

> *"I think there is room here for an incredible new product instead of a hacky collection of scripts."*
>
> This project is inspired by [Andrej Karpathy's post](https://x.com/karpathy/status/1908569640008794388) on using LLMs to build personal knowledge bases — collecting raw sources, compiling them into a markdown wiki, using Obsidian as the visual layer, and having the LLM do all the writing, linking, linting, and Q&A. wikillm turns that workflow into a single command.

## What you get

Run `npx wikillm` once, answer a few questions, and you'll have:

- A vault folder (`.kb/` in a project, `~/.wikillm/<name>/` for personal) with `raw/` for sources, `wiki/` for compiled articles, and an Obsidian-ready workspace config
- A tailored `CLAUDE.md` inside the vault that tells Claude Code how to operate the knowledge base (directory layout, conventions, automation schedule)
- Seven Claude Code skills for ingesting, querying, linting, and presenting your KB
- Optional scheduled automation that ingests new sources and lints the wiki on a cron

From then on, you drop files into `raw/`, run `/wikillm:ingest`, and ask `/wikillm:query` whatever you want. Claude reads the compiled wiki — not the raw sources — so queries are fast and answers are consistent.

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview) (required) — the CLI tool that runs the skills
- Node.js 18+ (for `npx wikillm`)
- [Obsidian](https://obsidian.md) (recommended) — for graph view, indexed search, and the Obsidian CLI. Enable via `Settings → General → Command line interface` once installed.
- [Marp CLI](https://github.com/marp-team/marp-cli) (optional) — only if you want the `slides` feature for generating decks from wiki content

## Setup

wikillm has **two install steps**: the Claude Code plugin (gives you `/wikillm:*` skills) and the `npx wikillm` CLI (scaffolds a vault). You need both.

### 1. Install the plugin in Claude Code

In an active Claude Code session, run these three slash commands:

```
/plugin marketplace add Berkay2002/wikillm
/plugin install wikillm@wikillm
/reload-plugins
```

They're idempotent — running them a second time is a safe no-op. After `/reload-plugins`, you should see `wikillm:query`, `wikillm:ingest`, `wikillm:lint`, and the other skills in your skills list. Invoke `/wikillm:using-wikillm` for the full orientation.

### 2. Scaffold a vault with `npx wikillm`

From a terminal, in whatever folder should contain the knowledge base:

```bash
# Personal KB (standalone vault)
cd ~ && npx wikillm

# Project KB (creates .kb/ in the current repo)
cd path/to/your/project && npx wikillm
```

The wizard asks for:

- **Name** — what to call the KB (e.g. `research`, `nexus-kb`)
- **Kind** — personal or project
- **Mode** — solo (full automation, you maintain it) or team (`.kb/` is shared via git, manual ingestion)
- **Features** — slides, reports, visualizations, web-clipper (each has a description in the wizard)
- **Domain** — optional free-text (e.g. `machine learning research`); used to seed tag vocabulary in the generated `CLAUDE.md`
- **Automation** — daily/weekly ingest + weekly lint (solo modes only; requires Claude Desktop running when the schedule fires)

When it finishes you'll have a vault folder with this structure:

```
<vault>/
├── CLAUDE.md              ← schema for this KB (LLM-owned, tailored to your config)
├── raw/                   ← drop your sources here
│   └── assets/
├── wiki/                  ← compiled articles (created by /wikillm:ingest)
│   └── _index/
│       ├── INDEX.md       ← content catalog
│       ├── TAGS.md        ← tag directory
│       ├── SOURCES.md     ← raw/ → wiki/ provenance map
│       ├── RECENT.md      ← last 20 changes
│       └── LOG.md         ← operation log
├── outputs/               ← generated slides/reports/visualizations (if enabled)
└── .obsidian/             ← Obsidian workspace config
```

## First-run walkthrough

After setup, the typical first run looks like this:

```bash
# 1. Drop some reference material into raw/
cp ~/Downloads/langchain-docs/*.md .kb/raw/langchain/

# 2. In Claude Code, compile the wiki
/wikillm:ingest

# (ingest detects unprocessed files, extracts concepts, writes articles,
#  cross-links with [[wikilinks]], updates indices, commits per source)

# 3. Query it
/wikillm:query "how does LangChain's Runnable interface work"

# 4. (Optional) Open in Obsidian for graph view and visual search
obsidian open vault="<your-kb-name>"
```

## Modes

| Mode | Vault location | Automation | Git policy |
|---|---|---|---|
| **Personal** | `~/.wikillm/<name>/` | Daily ingest, weekly lint (scheduled) | Private vault, solo commits |
| **Project Solo** | `<repo>/.kb/` | Daily ingest, weekly lint (scheduled) | `raw/` committed, `.obsidian/` workspace gitignored |
| **Project Team** | `<repo>/.kb/` | Manual only — pull before ingesting | `raw/` + `wiki/` committed, coordinate pushes |

Scheduled automation requires Claude Desktop to be running when the schedule fires. For terminal-only workflows, stick with manual `/wikillm:ingest` runs.

## Skills

All seven skills are installed via the Claude Code plugin:

| Skill | What it does |
|-------|-------------|
| `/wikillm:using-wikillm` | Orientation — how to use the plugin, detect a `.kb/` vault, integrate with a project's existing `CLAUDE.md` |
| `/wikillm:query` | Answer questions against the wiki. Picks an appropriate output format (inline, report, slides, visualization) |
| `/wikillm:ingest` | Compile new files from `raw/` into wiki articles with cross-references. Dispatches parallel workers for bulk imports |
| `/wikillm:lint` | Health check — broken wikilinks, orphan pages, missing frontmatter, contradictions, stale claims |
| `/wikillm:obsidian-cli` | Control Obsidian from the terminal — search, read, write, graph queries. Keeps Obsidian's index and graph in sync |
| `/wikillm:marp-cli` | Generate slide decks (PDF/PPTX/HTML) from wiki content |
| `/wikillm:generate-schema` | Regenerate a vault's `CLAUDE.md` from scratch. Use only if you customize config after init |

## CLI commands

| Command | What it does |
|---------|-------------|
| `npx wikillm` / `npx wikillm init` | Interactive vault setup |
| `npx wikillm doctor` | Check dependencies and vault health (run from inside a vault) |
| `npx wikillm update` | Print the slash commands to update the plugin in Claude Code |
| `npx wikillm --help` | Show available commands |

## Integrating a KB with an existing project's CLAUDE.md

`npx wikillm` **never touches your project's root `CLAUDE.md`** — the vault's schema lives at `<vault>/CLAUDE.md` only. After setup, manually add a short pointer to your project's existing `CLAUDE.md` so future Claude Code sessions know the KB exists:

```markdown
## Knowledge Base

This project has a wikillm knowledge base at `.kb/`. Third-party reference
material is compiled into a cross-referenced wiki at `.kb/wiki/`. Raw sources
live in `.kb/raw/`.

- To answer questions about the stack, use `/wikillm:query` instead of
  grepping `.kb/raw/` by hand — the wiki has already synthesized the material.
- To add new reference material, drop files in `.kb/raw/` and run `/wikillm:ingest`.
- To check wiki health, run `/wikillm:lint`.
- See `.kb/CLAUDE.md` for the vault's own conventions and rules.
```

The `/wikillm:using-wikillm` skill has the full integration guide with additional patterns for dev-time-only KBs, team mode, and KB-aware subagent rules.

## How it works

1. You drop sources (articles, PDFs, notes, clipped webpages) into `raw/`
2. `/wikillm:ingest` reads them, extracts concepts, writes cross-linked wiki articles, updates four indices (INDEX, TAGS, SOURCES, RECENT), and commits each source as a separate git commit
3. For bulk imports (3+ sources), ingest dispatches parallel `ingest-worker` subagents with a concept-ownership table so workers don't duplicate articles, then a reconciliation pass merges and cross-links their output
4. Obsidian gives you graph view, indexed search, and backlinks over the compiled wiki
5. `/wikillm:query` answers questions by reading wiki articles directly — not by grepping raw sources
6. `/wikillm:lint` runs periodically (or on-demand) to catch broken wikilinks, orphan pages, missing frontmatter, and contradictions

This is **not** RAG. Knowledge is compiled once into the wiki and kept current via ingest and lint — not re-derived from raw documents on every query. The cross-references are already there. The contradictions have already been flagged. The synthesis already reflects everything that's been read. Querying is fast because the hard work happens at compile time.

## Troubleshooting

**"`/wikillm:*` commands don't appear after install"**
Run `/reload-plugins` to reload the plugin list. If they still don't appear, confirm the marketplace was added with `/plugin marketplace list` — you should see `wikillm` in the output.

**"Obsidian CLI not detected" (or "binary found but not responding")**
Two independent things need to be true: (1) Obsidian desktop must be installed and running, (2) `Settings → General → Command line interface` must be enabled in the running instance. Until both hold, wikillm falls back to direct file tools, which works fine — you just miss graph view and indexed search.

**"CLAUDE.md wasn't written to my vault after `npx wikillm`"**
This was a silent-failure bug in 0.1.0 where the init flow shelled out to a subprocess that couldn't write the file. Fixed in 0.2.0 — the generator now runs in-process and verifies the file after writing. If you're on 0.1.0, upgrade with `npx wikillm@latest` and re-run in the same directory (it'll prompt to overwrite the existing vault scaffold).

**"Scheduled automation didn't run"**
Scheduled ingest and lint require Claude Desktop to be running when the schedule fires. If you work exclusively from the terminal, run `/wikillm:ingest` manually after adding sources and skip the automation opt-in during `npx wikillm`.

**"I want to query an old version of an article"**
`raw/` is immutable and the wiki is under git — use `git log` on `wiki/<article>.md` to see the history, or `git show <rev>:wiki/<article>.md` to read an older version.

## License

MIT
