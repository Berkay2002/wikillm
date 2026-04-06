# wikillm

LLM-maintained knowledge bases powered by Claude Code and Obsidian.

Drop sources in `raw/`, and Claude compiles them into a cross-referenced wiki — no vector stores, no embeddings, no RAG pipeline. Just markdown.

> *"I think there is room here for an incredible new product instead of a hacky collection of scripts."*
>
> This project is inspired by [Andrej Karpathy's post](https://x.com/karpathy/status/1908569640008794388) on using LLMs to build personal knowledge bases — collecting raw sources, compiling them into a markdown wiki, using Obsidian as the visual layer, and having the LLM do all the writing, linking, linting, and Q&A. wikillm turns that workflow into a single command.

## Quick Start

```bash
npx wikillm
```

Follow the interactive prompts to set up your knowledge base.

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview) (required)
- [Obsidian](https://obsidian.md) with CLI enabled (recommended)
- [Marp CLI](https://github.com/marp-team/marp-cli) (optional, for slide generation)

## Modes

**Personal** — A standalone vault. Your brain extension. Full automation with scheduled ingestion and linting.

**Project (Solo)** — A `.kb/` folder in your repo. Same automation as personal, scoped to a project.

**Project (Team)** — A `.kb/` folder shared via git. Manual ingestion to avoid conflicts.

## Skills

Once set up, use these in Claude Code:

| Skill | What it does |
|-------|-------------|
| `/wikillm:ingest` | Process new files from `raw/` into wiki articles |
| `/wikillm:lint` | Health check — fix broken links, orphans, missing frontmatter |
| `/wikillm:query` | Ask questions against your knowledge base |
| `/wikillm:marp-cli` | Generate slide decks from wiki content |

## CLI Commands

| Command | What it does |
|---------|-------------|
| `wikillm init` | Interactive setup |
| `wikillm doctor` | Check dependencies and vault health |
| `wikillm update` | Update the plugin to latest |

## How It Works

1. You drop sources (articles, PDFs, notes) into `raw/`
2. Claude reads them and compiles wiki articles with cross-references
3. Obsidian gives you graph view, search, and backlinks
4. The wiki is the knowledge base — compiled once, always up to date

This is **not** RAG. Knowledge is compiled once into the wiki and kept current — not re-derived from raw documents on every query. The cross-references are already there. The contradictions have already been flagged. The synthesis already reflects everything that's been read.

## License

MIT
