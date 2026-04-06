---
name: obsidian-cli
description: Use the Obsidian CLI to interact with vaults from the terminal. Use this skill whenever you need to search, read, create, modify, or manage files in an Obsidian vault programmatically — including searching notes, listing tags, finding orphan pages, checking backlinks, managing properties, working with tasks, or any vault operation. Also use when the user mentions Obsidian CLI, asks about obsidian commands, or when working with a knowledge base vault. Prefer the Obsidian CLI over direct file operations when the Obsidian desktop app is running, because the CLI keeps Obsidian's search index, graph, and plugins in sync.
---

# Obsidian CLI

Control Obsidian from the terminal. The CLI requires the Obsidian desktop app to be running.

## Install Check

Before using Obsidian CLI commands, verify it's available:

1. Run `which obsidian` or `obsidian --version`
2. If not found, ask the user: "Obsidian CLI is not installed. Would you like me to help you set it up? You'll need the Obsidian desktop app with CLI enabled (Settings → General → Command line interface)."
3. If Obsidian is not running, fall back to direct file tools (Read/Write/Edit/Grep) for all operations.

## When to Use CLI vs Direct File Tools

**Use the Obsidian CLI for:**
- Searching vault content (uses Obsidian's indexed search, faster and more accurate)
- Reading files when you need Obsidian's wikilink resolution (`file=` resolves like wikilinks)
- Querying graph structure: backlinks, orphans, deadends, unresolved links
- Managing properties, tags, tasks (Obsidian updates its caches immediately)
- Creating files from templates
- Any operation where Obsidian plugins should react to the change

**Use direct file tools (Read/Write/Edit/Grep) for:**
- Bulk file operations across many files at once
- Complex text transformations (regex, multi-line edits)
- When Obsidian desktop isn't running
- When you need line-number precision

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
obsidian search query="attention mechanism"
obsidian search:context query="transformer" limit=5    # with line context

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

**"Obsidian is not running"** — Start the desktop app first. The CLI communicates with the running app.

**Command not found** — Ensure CLI is enabled: Obsidian Settings → General → Command line interface. On macOS, the installer modifies `~/.zprofile`. Restart your shell.

**File not found with `file=`** — The `file` parameter uses wikilink resolution (name-based, case-insensitive). Use `path=` for exact paths.

**Multi-vault** — Add `vault=<name>` to any command. Run `obsidian vaults verbose` to list all vaults with paths.
