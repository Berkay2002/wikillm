---
name: obsidian-cli
description: Use the Obsidian CLI to interact with vaults from the terminal. Use this skill whenever you need to search, read, create, modify, or manage files in an Obsidian vault programmatically — including searching notes, listing tags, finding orphan pages, checking backlinks, managing properties, working with tasks, or any vault operation. Also use when the user mentions Obsidian CLI, asks about obsidian commands, or when working with a knowledge base vault. Prefer the Obsidian CLI over direct file operations when the Obsidian desktop app is running, because the CLI keeps Obsidian's search index, graph, and plugins in sync.
---

# Obsidian CLI

Control Obsidian from the terminal. The CLI requires the Obsidian desktop app to be running.

## Install Check

Before using Obsidian CLI commands, verify two separate things: that the CLI is installed **and** that the desktop app is actually running.

1. **Is the CLI installed?** Run `which obsidian` (POSIX) or `where obsidian` (Windows). If not found, ask the user: "Obsidian CLI is not installed. Would you like me to help you set it up? You'll need the Obsidian desktop app with CLI enabled (Settings → General → Command line interface)."
2. **Is the desktop app running?** Run `obsidian vaults`. This command requires the app's IPC channel — if it errors or hangs, Obsidian is closed and you should fall back to direct file tools (Read/Write/Edit/Grep) for all operations. **Do not use `obsidian --version` for this check** — it succeeds when the binary is installed even if the app is closed, which will fool you into thinking the CLI is live when it isn't.
3. **In multi-vault setups**, scope every command with `vault="<name>"`. Run `obsidian vaults verbose` to list available vaults with their paths.

## When to Use CLI vs Direct File Tools

**Use the Obsidian CLI for:**

- **Graph queries — the killer feature.** `obsidian backlinks file=X`, `obsidian links file=X`, `obsidian orphans`, `obsidian unresolved`. These are impossible cleanly from Grep and they're the main reason to keep knowledge in Obsidian rather than as loose markdown. After reading a primary article, run `backlinks` to find hub articles you'd otherwise miss.
- Searching vault content (uses Obsidian's indexed search — faster and more accurate than Grep)
- Reading files when you need Obsidian's wikilink resolution (`file=` resolves like wikilinks — no path needed)
- Managing properties, tags, tasks (Obsidian updates its caches immediately)
- Creating files from templates
- Any operation where Obsidian plugins should react to the change

**Use direct file tools (Read/Write/Edit/Grep) for:**

- **Targeted lookups where you already know the article.** If INDEX or a backlink query has pinned the answer to a specific file, `Read` is one round-trip vs. search-then-read.
- Bulk file operations across many files at once
- Complex text transformations (regex, multi-line edits)
- When Obsidian desktop isn't running
- When you need line-number precision
- When a subcommand you need contains a `:` and the shell mangles it (see Troubleshooting → "Subcommands with `:` exit 127 on Git Bash")

You can mix both freely — Obsidian picks up direct file changes on next refresh.

## Quick Reference

### Targeting Files

Two ways to specify files:
- `file=<name>` — resolves like wikilinks (partial match, no extension needed)
- `path=<path>` — exact vault-root relative path

Most commands default to the active file when neither is given.

### Common Patterns

```bash
# Search
obsidian search query="attention mechanism"                  # vault-wide (includes raw/)
obsidian search query="attention" path="wiki"                # wiki only — skip raw/ noise
obsidian "search:context" query="transformer" limit=5        # with line context (colon-subcommand: may fail on Git Bash, see Troubleshooting)

# Read & Write
obsidian read file="my-note"
obsidian append file="log" content="- New entry\n"
obsidian create name="new-article" content="# Title\n\nContent" path="wiki/"

# Graph queries
obsidian backlinks file="attention-mechanism"           # who links here?
obsidian links file="attention-mechanism"               # what does this link to?
obsidian orphans                                        # no incoming links
obsidian deadends                                       # no outgoing links
obsidian unresolved verbose                             # broken wikilinks

# Properties
obsidian property:set name=status value=draft file="my-note"
obsidian property:read name=tags file="my-note"
obsidian tags counts sort=count                         # all tags with counts

# Tasks
obsidian tasks todo                                     # incomplete tasks
obsidian task file="todo" line=5 done                   # mark task done

# Daily notes
obsidian daily:append content="- Met with team about X"
obsidian daily:read

# Files & structure
obsidian files folder="wiki" ext=md                     # list wiki markdown files
obsidian files total                                    # count all files
obsidian outline file="long-article" format=md          # headings

# Multi-vault
obsidian search query="meeting" vault="work"
```

### Output Formats

Many commands support `format=json|tsv|csv`. JSON is best for programmatic parsing:
```bash
obsidian tags counts format=json
obsidian backlinks file="index" format=json
```

Use `total` flag to get counts instead of lists:
```bash
obsidian files total              # "42"
obsidian orphans total            # "3"
obsidian tasks todo total         # "17"
```

Use `--copy` to copy output to clipboard.

### Content Formatting

- Use `\n` for newlines: `content="Line 1\nLine 2"`
- Use `\t` for tabs
- Quote values with spaces: `name="My Long Note Title"`
- `inline` flag on append/prepend skips the leading newline

## Full Command Reference

For the complete list of all 100+ commands with every parameter and flag, read:
`references/cli-reference.md`

Key sections in the reference:
- **File Operations**: create, read, append, prepend, move, rename, delete
- **Search**: search, search:context, search:open
- **Links & Graph**: backlinks, links, orphans, deadends, unresolved
- **Properties & Tags**: property:set/read/remove, tags, tag
- **Tasks**: tasks, task (toggle/done/todo)
- **Templates**: templates, template:read, template:insert
- **Plugins & Themes**: plugin management, theme management
- **Bases**: database queries (base:query, base:create)
- **Sync & History**: sync control, file recovery
- **Developer**: eval, dev:dom, dev:screenshot, dev:console

## Troubleshooting

**"Obsidian is not running"** — Start the desktop app first. The CLI communicates with the running app. Verify liveness with `obsidian vaults` (not `obsidian --version`, which succeeds even when the app is closed).

**Command not found** — Ensure CLI is enabled: Obsidian Settings → General → Command line interface. On macOS, the installer modifies `~/.zprofile`. Restart your shell.

**File not found with `file=`** — The `file` parameter uses wikilink resolution (name-based, case-insensitive). Use `path=` for exact paths.

**Multi-vault** — Add `vault=<name>` to any command. Run `obsidian vaults verbose` to list all vaults with paths.

**Subcommands with `:` exit 127 on Git Bash (Windows)** — Commands whose names contain a colon (`search:context`, `search:open`, `property:set`, `property:read`, `property:remove`, `daily:append`, `daily:read`, `daily:prepend`, `daily:path`, `base:query`, `base:create`, `base:views`, `template:read`, `template:insert`, `plugin:*`, `theme:*`, `snippet:*`, `sync:*`, `history:*`, `dev:*`, `tab:open`) can fail with exit code 127 on Git Bash for Windows — even though `obsidian help "search:context"` works fine. This is a shell-wrapper / argv parsing issue with colons in `argv[1]`. Workarounds in order of preference:

1. **Quote the subcommand:** `obsidian "search:context" query="X"` — works on some shells but not reliably on Git Bash.
2. **Use the non-colon equivalent** when one exists: plain `obsidian search` returns file-path lists without inline line context, which is often enough.
3. **Run from PowerShell or CMD** instead of Git Bash — colons survive argv parsing correctly there.
4. **Fall back to `Grep` / `Read`** for that specific operation when no workaround applies.

On macOS and Linux, no workaround is needed — colon subcommands work correctly.

**Search noise from `raw/`** — `obsidian search` returns matches from both `raw/` (immutable source material) and `wiki/` (compiled articles) indistinguishably. When querying compiled knowledge, scope searches with `path="wiki"`:

```bash
obsidian search query="<term>" path="wiki"
```

The `raw/` folder is the *input* to the wiki, not an answer store — don't pull facts from it directly.
