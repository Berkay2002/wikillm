# Obsidian CLI Complete Reference

Generated from `obsidian help` on a live installation.

## Usage

```
obsidian <command> [options]
```

**Global options:**
- `vault=<name>` — Target a specific vault by name
- `--copy` — Copy output to clipboard

**Notes:**
- `file` resolves by name (like wikilinks), `path` is exact (vault-root relative)
- Most commands default to the active file when file/path is omitted
- Quote values with spaces: `name="My Note"`
- Use `\n` for newline, `\t` for tab in content values
- Obsidian desktop app must be running for CLI to work

## File Operations

### create — Create a new file
```
obsidian create name=<name> [path=<path>] [content=<text>] [template=<name>] [overwrite] [open] [newtab]
```

### read — Read file contents
```
obsidian read [file=<name>] [path=<path>]
```

### append — Append content to a file
```
obsidian append [file=<name>] [path=<path>] content=<text> [inline]
```

### prepend — Prepend content to a file
```
obsidian prepend [file=<name>] [path=<path>] content=<text> [inline]
```

### move — Move or rename a file
```
obsidian move [file=<name>] [path=<path>] to=<path>
```

### rename — Rename a file
```
obsidian rename [file=<name>] [path=<path>] name=<name>
```

### delete — Delete a file
```
obsidian delete [file=<name>] [path=<path>] [permanent]
```

### file — Show file info
```
obsidian file [file=<name>] [path=<path>]
```

### files — List files in the vault
```
obsidian files [folder=<path>] [ext=<extension>] [total]
```

### folder — Show folder info
```
obsidian folder path=<path> [info=files|folders|size]
```

### folders — List folders in the vault
```
obsidian folders [folder=<path>] [total]
```

### open — Open a file
```
obsidian open [file=<name>] [path=<path>] [newtab]
```

## Search

### search — Search vault for text
```
obsidian search query=<text> [path=<folder>] [limit=<n>] [total] [case] [format=text|json]
```

### search:context — Search with matching line context
```
obsidian search:context query=<text> [path=<folder>] [limit=<n>] [case] [format=text|json]
```

### search:open — Open search view in Obsidian
```
obsidian search:open [query=<text>]
```

## Daily Notes

### daily — Open today's note
```
obsidian daily [paneType=tab|split|window]
```

### daily:path — Get daily note path
```
obsidian daily:path
```

### daily:read — Read daily note contents
```
obsidian daily:read
```

### daily:append — Append to daily note
```
obsidian daily:append content=<text> [inline] [open] [paneType=tab|split|window]
```

### daily:prepend — Prepend to daily note
```
obsidian daily:prepend content=<text> [inline] [open] [paneType=tab|split|window]
```

## Links & Graph

### backlinks — List backlinks to a file
```
obsidian backlinks [file=<name>] [path=<path>] [counts] [total] [format=json|tsv|csv]
```

### links — List outgoing links from a file
```
obsidian links [file=<name>] [path=<path>] [total]
```

### unresolved — List unresolved links in vault
```
obsidian unresolved [total] [counts] [verbose] [format=json|tsv|csv]
```

### orphans — List files with no incoming links
```
obsidian orphans [total] [all]
```

### deadends — List files with no outgoing links
```
obsidian deadends [total] [all]
```

## Properties & Metadata

### properties — List properties in the vault
```
obsidian properties [file=<name>] [path=<path>] [name=<name>] [total] [sort=count] [counts] [format=yaml|json|tsv] [active]
```

### property:set — Set a property on a file
```
obsidian property:set name=<name> value=<value> [type=text|list|number|checkbox|date|datetime] [file=<name>] [path=<path>]
```

### property:read — Read a property value
```
obsidian property:read name=<name> [file=<name>] [path=<path>]
```

### property:remove — Remove a property
```
obsidian property:remove name=<name> [file=<name>] [path=<path>]
```

## Tags

### tags — List tags in the vault
```
obsidian tags [file=<name>] [path=<path>] [total] [counts] [sort=count] [format=json|tsv|csv] [active]
```

### tag — Get tag info
```
obsidian tag name=<tag> [total] [verbose]
```

## Tasks

### tasks — List tasks in the vault
```
obsidian tasks [file=<name>] [path=<path>] [total] [done] [todo] [status="<char>"] [verbose] [format=json|tsv|csv] [active] [daily]
```

### task — Show or update a task
```
obsidian task [ref=<path:line>] [file=<name>] [path=<path>] [line=<n>] [toggle] [done] [todo] [daily] [status="<char>"]
```

## Aliases

### aliases — List aliases in the vault
```
obsidian aliases [file=<name>] [path=<path>] [total] [verbose] [active]
```

## Bookmarks

### bookmark — Add a bookmark
```
obsidian bookmark [file=<path>] [subpath=<subpath>] [folder=<path>] [search=<query>] [url=<url>] [title=<title>]
```

### bookmarks — List bookmarks
```
obsidian bookmarks [total] [verbose] [format=json|tsv|csv]
```

## Templates

### templates — List templates
```
obsidian templates [total]
```

### template:read — Read template content
```
obsidian template:read name=<template> [resolve] [title=<title>]
```

### template:insert — Insert template into active file
```
obsidian template:insert name=<template>
```

## Outline & Word Count

### outline — Show headings for a file
```
obsidian outline [file=<name>] [path=<path>] [format=tree|md|json] [total]
```

### wordcount — Count words and characters
```
obsidian wordcount [file=<name>] [path=<path>] [words] [characters]
```

## Workspace & Tabs

### workspace — Show workspace tree
```
obsidian workspace [ids]
```

### workspaces — List saved workspaces

### workspace:save / workspace:load / workspace:delete — Manage layouts

### tabs — List open tabs
```
obsidian tabs [ids]
```

### tab:open — Open a new tab
```
obsidian tab:open [group=<id>] [file=<path>] [view=<type>]
```

### recents — List recently opened files
```
obsidian recents [total]
```

## Plugins & Themes

### plugins — List installed plugins
```
obsidian plugins [filter=core|community] [versions] [format=json|tsv|csv]
```

### plugins:enabled — List enabled plugins
```
obsidian plugins:enabled [filter=core|community] [versions] [format=json|tsv|csv]
```

### plugin:enable / plugin:disable
```
obsidian plugin:enable id=<id> [filter=core|community]
obsidian plugin:disable id=<id> [filter=core|community]
```

### plugin:install / plugin:uninstall
```
obsidian plugin:install id=<id> [enable]
obsidian plugin:uninstall id=<id>
```

### plugin:reload — Reload a plugin (dev)
```
obsidian plugin:reload id=<id>
```

### plugins:restrict — Toggle restricted mode
```
obsidian plugins:restrict [on] [off]
```

### themes / theme:set / theme:install / theme:uninstall
```
obsidian themes [versions]
obsidian theme:set name=<name>
obsidian theme:install name=<name> [enable]
obsidian theme:uninstall name=<name>
```

### snippets / snippet:enable / snippet:disable
```
obsidian snippets
obsidian snippets:enabled
obsidian snippet:enable name=<name>
obsidian snippet:disable name=<name>
```

## Bases (Database)

### bases — List all base files
```
obsidian bases
```

### base:query — Query a base
```
obsidian base:query [file=<name>] [path=<path>] [view=<name>] [format=json|csv|tsv|md|paths]
```

### base:create — Create item in a base
```
obsidian base:create [file=<name>] [path=<path>] [view=<name>] [name=<name>] [content=<text>] [open] [newtab]
```

### base:views — List views in a base
```
obsidian base:views
```

## Publishing

### publish:site — Show site info
### publish:list — List published files
### publish:status — Review pending changes
### publish:add / publish:remove — Manage published content
### publish:open — Visit published site

## Sync

### sync — Pause or resume sync
```
obsidian sync [on] [off]
```

### sync:status — Show sync status
### sync:history — List sync versions for a file
### sync:read — Read a sync version
### sync:restore — Restore a sync version
### sync:deleted — List deleted files in sync

## File History (Local Recovery)

### history — List file history versions
```
obsidian history [file=<name>] [path=<path>]
```

### history:list — List files with history
### history:open — Open file recovery UI
### history:read — Read a history version
### history:restore — Restore a history version

## Developer Tools

### devtools — Toggle Electron dev tools
### dev:screenshot — Take a screenshot
```
obsidian dev:screenshot [path=<filename>]
```

### dev:console — Show console messages
```
obsidian dev:console [clear] [limit=<n>] [level=log|warn|error|info|debug]
```

### dev:dom — Query DOM elements
```
obsidian dev:dom selector=<css> [total] [text] [inner] [all] [attr=<name>] [css=<prop>]
```

### dev:css — Inspect CSS
```
obsidian dev:css selector=<css> [prop=<name>]
```

### dev:cdp — Run Chrome DevTools Protocol command
```
obsidian dev:cdp method=<CDP.method> [params=<json>]
```

### eval — Execute JavaScript
```
obsidian eval code=<javascript>
```

### dev:mobile — Toggle mobile emulation
```
obsidian dev:mobile [on] [off]
```

### dev:debug — Attach/detach CDP debugger
```
obsidian dev:debug [on] [off]
```

### dev:errors — Show captured errors
```
obsidian dev:errors [clear]
```

## Misc

### vault — Show vault info
```
obsidian vault [info=name|path|files|folders|size]
```

### vaults — List known vaults
```
obsidian vaults [total] [verbose]
```

### version — Show Obsidian version
### reload — Reload the vault
### restart — Restart the app
### random — Open a random note
### random:read — Read a random note
### unique — Create unique-named note
### web — Open URL in web viewer
```
