# wikillm

LLM-maintained knowledge bases powered by Claude Code/Codex and Obsidian.

Drop sources in `raw/`, and your agent compiles them into a cross-referenced wiki — no vector stores, no embeddings, no RAG pipeline. Just markdown.

> *"I think there is room here for an incredible new product instead of a hacky collection of scripts."*
>
> This project is inspired by [Andrej Karpathy's post](https://x.com/karpathy/status/1908569640008794388) on using LLMs to build personal knowledge bases — collecting raw sources, compiling them into a markdown wiki, using Obsidian as the visual layer, and having the LLM do all the writing, linking, linting, and Q&A. wikillm turns that workflow into a single command.

## What you get

Run `npx wikillm` once, answer a few questions, and you'll have:

- A vault folder (`.kb/` in a project, `~/.wikillm/<name>/` for personal) with `raw/` for sources, `wiki/` for compiled articles, and an Obsidian-ready workspace config
- A tailored `CLAUDE.md`, `AGENTS.md`, or both inside the vault that tells your agent how to operate the knowledge base (directory layout, conventions, automation guidance)
- Seven agent skills for ingesting, querying, linting, and presenting your KB
- Optional automation guidance metadata that tells the selected agent host which ingest and lint commands to run

From then on, you drop files into `raw/`, run the ingest skill (`/wikillm:ingest` in Claude Code, `$wikillm:ingest` in Codex), and ask the query skill whatever you want. The agent reads the compiled wiki — not the raw sources — so queries are fast and answers are consistent.

## Design choices

- **Compile once, query many times.** Ingest turns raw sources into durable wiki articles, so later questions read the synthesis instead of re-running retrieval over the same material.
- **Raw sources are immutable.** Corrections come in as new sources; the wiki synthesis reconciles them and records provenance in `SOURCES.md`.
- **The graph matters.** Articles use `[[wikilinks]]`, backlink traversal, hubs, and orphan checks instead of flat markdown search alone.
- **Failure modes are explicit.** Lint checks broken links, missing frontmatter, orphan pages, contradictions, stale claims, duplicate candidates, and disconnected graph clusters.
- **Bulk ingest has ownership boundaries.** For larger imports, the orchestrator assigns concepts to workers before dispatch so parallel agents do not create duplicate pages for the same concept.

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview) or Codex (required) — the agent host that runs the skills
- Node.js 18+ (for `npx wikillm`)
- [Obsidian](https://obsidian.md) (recommended) — for graph view, indexed search, and the Obsidian CLI. Enable via `Settings → General → Command line interface` once installed.
- [Marp CLI](https://github.com/marp-team/marp-cli) (optional) — only if you want the `slides` feature for generating decks from wiki content

## Setup

wikillm has **two install steps**: the agent plugin (gives you wikillm skills) and the `npx wikillm` CLI (scaffolds a vault). You need both.

### 1. Install the plugin

For Claude Code, run these three slash commands in an active Claude Code session:

```
/plugin marketplace add Berkay2002/wikillm
/plugin install wikillm@wikillm
/reload-plugins
```

They're idempotent — running them a second time is a safe no-op. After `/reload-plugins`, you should see `wikillm:query`, `wikillm:ingest`, `wikillm:lint`, and the other skills in your skills list. Invoke `/wikillm:using-wikillm` for the full orientation.

For Codex, plugins are installed from a marketplace. This repo includes a Codex-native marketplace at `.agents/plugins/marketplace.json` and a plugin manifest at `.codex-plugin/plugin.json`, so the GitHub repo can be added as a marketplace source:

```bash
codex plugin marketplace add Berkay2002/wikillm
```

Then open the Codex plugin directory, choose the `wikillm` marketplace, install `wikillm`, and start a new Codex thread so `$wikillm:*` skills are loaded. For a local checkout, use `codex plugin marketplace add ./path/to/wikillm` instead. Invoke `$wikillm:using-wikillm` for the full orientation.

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
- **Hosts** — Claude Code, Codex, or both
- **Mode** — solo (automation guidance available, you maintain it) or team (`.kb/` is shared via git, manual ingestion)
- **Features** — slides, reports, visualizations, web-clipper (each has a description in the wizard)
- **Domain** — optional free-text (e.g. `machine learning research`); used to seed tag vocabulary in the generated schema
- **Automation** — daily/weekly ingest guidance + weekly lint guidance (solo modes only; you configure the selected agent app to run the commands)

When it finishes you'll have a vault folder with this structure:

```
<vault>/
├── CLAUDE.md / AGENTS.md  ← schema for this KB (LLM-owned, tailored to your config)
├── raw/                   ← drop your sources here
│   └── assets/
├── wiki/                  ← compiled articles (created by the ingest skill)
│   └── _index/
│       ├── INDEX.md       ← content catalog
│       ├── TAGS.md        ← tag directory
│       ├── SOURCES.md     ← raw/ → wiki/ provenance map
│       ├── RECENT.md      ← last 20 changes
│       └── LOG.md         ← operation log
├── outputs/               ← generated slides/reports/visualizations (if enabled)
├── .wikillm/              ← wikillm metadata such as automation guidance (if enabled)
└── .obsidian/             ← Obsidian workspace config
```

## First-run walkthrough

After setup, the typical first run looks like this:

1. **Drop reference material into `raw/`** — articles, PDFs, markdown docs, clipped webpages, whatever you want compiled. Keep meaningful subfolders (`raw/<topic>/`) so later lookups are easier.
2. **Compile the wiki** — run `/wikillm:ingest` in Claude Code or `$wikillm:ingest` in Codex. It detects unprocessed files, extracts concepts, writes cross-linked articles, updates the indices, and commits one git commit per source file. Bulk imports (3+ files) dispatch parallel workers.
3. **Query it** — run `/wikillm:query "your question"` in Claude Code or `$wikillm:query "your question"` in Codex. The agent reads the compiled wiki — not the raw sources — and picks an appropriate output format (inline answer, report, slide deck, or visualization).
4. **(Optional) Open in Obsidian** for graph view, backlinks, and visual search: `obsidian open vault="<your-kb-name>"`.

## Modes

| Mode | Vault location | Automation | Git policy |
|---|---|---|---|
| **Personal** | `~/.wikillm/<name>/` | Daily ingest and weekly lint guidance | Private vault, solo commits |
| **Project Solo** | `<repo>/.kb/` | Daily ingest and weekly lint guidance | `raw/` committed, `.obsidian/` workspace gitignored |
| **Project Team** | `<repo>/.kb/` | Manual only — pull before ingesting | `raw/` + `wiki/` committed, coordinate pushes |

Automation guidance is written to `.wikillm/automation.json` when enabled. `npx wikillm` records the commands, cadence, and host-ready prompt text, but it does not install schedules into Claude Desktop or Codex. For Claude Code Desktop, paste `claudeScheduledTaskPrompt` into any Desktop session and ask Claude to create a local scheduled task. For Codex, paste `codexAutomationPrompt` into a regular Codex thread and ask Codex to create a standalone project automation. Use the current/local project when new `.kb/raw/` files are usually uncommitted; use a background worktree when raw sources are committed before each run and you want automation changes isolated from unfinished local work.

## Skills

All seven skills are installed via the agent plugin. Claude Code uses `/wikillm:*`; Codex uses `$wikillm:*`.

| Skill | What it does |
|-------|-------------|
| `using-wikillm` | Orientation — how to use the plugin, detect a `.kb/` vault, integrate with a project's root instructions |
| `query` | Answer questions against the wiki. Picks an appropriate output format (inline, report, slides, visualization) |
| `ingest` | Compile new files from `raw/` into wiki articles with cross-references. Dispatches parallel workers for bulk imports |
| `lint` | Health check — broken wikilinks, orphan pages, missing frontmatter, contradictions, stale claims |
| `obsidian-cli` | Control Obsidian from the terminal — search, read, write, graph queries. Keeps Obsidian's index and graph in sync |
| `marp-cli` | Generate slide decks (PDF/PPTX/HTML) from wiki content |
| `generate-schema` | Regenerate a vault's `CLAUDE.md` or `AGENTS.md` from scratch. Use only if you customize config after init |

## Claude Code vs Codex workers

The core skills are shared, but worker registration is different:

- **Claude Code** uses the bundled `agents/ingest-worker.md` file as a Claude Code subagent definition for bulk ingest.
- **Codex** gets the same worker behavior through the ingest skill. The Codex plugin does not automatically register `agents/ingest-worker.md` as a custom agent. For bulk ingest, the skill explicitly spawns subagents with the worker prompt in `skills/ingest/references/ingest-worker.md`.
- **Codex automations** can invoke `$wikillm:ingest`, but a run that should parallelize needs that instruction in the automation prompt: "If there are 3+ new sources, explicitly spawn one subagent per source using the ingest-worker prompt, wait for all workers, then reconcile." Test the prompt manually in a regular Codex thread before scheduling it, then review the first few automation outputs.

## CLI commands

| Command | What it does |
|---------|-------------|
| `npx wikillm` / `npx wikillm init` | Interactive vault setup |
| `npx wikillm doctor` | Check dependencies and vault health (run from a vault or project root with `.kb/`) |
| `npx wikillm update` | Print instructions to update the plugin in Claude Code or Codex |
| `npx wikillm --help` | Show available commands |

## Integrating a KB with existing project instructions

`npx wikillm` **never touches your project's root instruction files** — the vault's schema lives at `<vault>/CLAUDE.md` or `<vault>/AGENTS.md`, so your project's own instructions are never clobbered.

After setup, run `/wikillm:using-wikillm` in Claude Code or `$wikillm:using-wikillm` in Codex and ask it to wire the KB into your project's existing `CLAUDE.md` or `AGENTS.md`. The skill contains the canonical integration pattern (dev-time KBs, team mode, KB-aware subagent rules) and will produce the right snippet for your project without you having to paste anything by hand.

## How it works

1. You drop sources (articles, PDFs, notes, clipped webpages) into `raw/`
2. The ingest skill reads them, extracts concepts, writes cross-linked wiki articles, updates the index files (INDEX, TAGS, SOURCES, RECENT, LOG), and commits each source as a separate git commit
3. For bulk imports (3+ sources), ingest dispatches parallel workers with a concept-ownership table so workers don't duplicate articles, then a reconciliation pass merges and cross-links their output. Claude Code uses `agents/ingest-worker.md`; Codex uses the worker prompt under `skills/ingest/references/`.
4. Obsidian gives you graph view, indexed search, and backlinks over the compiled wiki
5. The query skill answers questions by reading wiki articles directly — not by grepping raw sources
6. The lint skill runs periodically (or on-demand) to catch broken wikilinks, orphan pages, missing frontmatter, and contradictions

This is **not** RAG. Knowledge is compiled once into the wiki and kept current via ingest and lint — not re-derived from raw documents on every query. The cross-references are already there. The contradictions have already been flagged. The synthesis already reflects everything that's been read. Querying is fast because the hard work happens at compile time.

## Troubleshooting

**"`/wikillm:*` or `$wikillm:*` commands don't appear after install"**
For Claude Code, run `/reload-plugins` to reload the plugin list. If they still don't appear, confirm the marketplace was added with `/plugin marketplace list` — you should see `wikillm` in the output. For Codex, start a new thread after installing or reinstalling the plugin so the skill list is refreshed.

**"Obsidian CLI not detected" (or "binary found but not responding")**
Two independent things need to be true: (1) Obsidian desktop must be installed and running, (2) `Settings → General → Command line interface` must be enabled in the running instance. Until both hold, wikillm falls back to direct file tools, which works fine — you just miss graph view and indexed search.

Note that `obsidian --version` succeeds even when the desktop app is closed (it only tests that the binary is installed). wikillm uses `obsidian vaults` as the real liveness check — if it errors or hangs, Obsidian isn't running and you should start the desktop app before retrying.

**"`search:context` (or other colon subcommands) exits 127 on Windows"**
On Git Bash for Windows, Obsidian CLI subcommands whose names contain a colon — `search:context`, `property:set`, `daily:append`, `base:query`, `dev:*`, and similar — can fail with exit code 127 due to how Git Bash parses `argv[1]`. Workarounds: run from PowerShell or CMD (colons survive argv parsing correctly there), or use the non-colon equivalent when one exists (plain `obsidian search` for most lookups). wikillm's skills already fall back to `Grep`/`Read` for operations that can't be worked around, so day-to-day flows aren't blocked — this mainly matters if you're calling the CLI directly from scripts.

**"CLAUDE.md or AGENTS.md wasn't written to my vault after `npx wikillm`"**
This was a silent-failure bug in 0.1.0 where the init flow shelled out to a subprocess that couldn't write the file. Fixed in 0.2.0 — the generator now runs in-process and verifies each file after writing. If you're on 0.1.0, upgrade with `npx wikillm@latest` and re-run in the same directory (it'll prompt to overwrite the existing vault scaffold).

**"Automation guidance didn't run"**
`npx wikillm` writes `.wikillm/automation.json`; it does not install a system cron or host-app schedule. For Claude Code Desktop, create a local scheduled task from any Desktop session using `claudeScheduledTaskPrompt`, then click **Run now** and approve only the tools the task needs. Local Claude scheduled tasks run only while Desktop is open and the machine is awake. For Codex, create the automation from a regular thread using `codexAutomationPrompt`. For project-scoped Codex automations, the machine running the local Codex app must be powered on, Codex must be running, and the selected project must still be available on disk when the automation is scheduled to run. If you work exclusively from the terminal, run ingest manually after adding sources and skip the automation opt-in during `npx wikillm`.

**"I want to query an old version of an article"**
`raw/` is immutable and the wiki is under git — use `git log` on `wiki/<article>.md` to see the history, or `git show <rev>:wiki/<article>.md` to read an older version.

## License

MIT
