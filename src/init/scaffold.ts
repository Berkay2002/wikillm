import { mkdir, writeFile, access } from "fs/promises";
import { join } from "path";
import { execa } from "execa";
import { confirm } from "@inquirer/prompts";
import { log } from "../utils/logger.js";
import type { WikillmConfig } from "./prompts.js";

export async function scaffold(config: WikillmConfig): Promise<void> {
  const root = config.path;

  // Check if directory already exists
  try {
    await access(root);
    const overwrite = await confirm({
      message: `${root} already exists. Overwrite?`,
      default: false,
    });
    if (!overwrite) {
      log.error("Aborted. Choose a different location.");
      process.exit(1);
    }
  } catch {
    // Directory doesn't exist — good, proceed
  }

  // Create directory structure
  await mkdir(join(root, "raw", "assets"), { recursive: true });
  await mkdir(join(root, "wiki", "_index"), { recursive: true });

  if (config.features.includes("slides")) {
    await mkdir(join(root, "outputs", "slides"), { recursive: true });
  }
  if (config.features.includes("reports")) {
    await mkdir(join(root, "outputs", "reports"), { recursive: true });
  }
  if (config.features.includes("visualizations")) {
    await mkdir(join(root, "outputs", "visualizations"), { recursive: true });
  }

  log.success("Created folder structure");

  // Write a vault .gitignore for every mode. Patterns resolve relative to
  // the vault, so this works both as the top-level .gitignore in a personal
  // vault and as a nested .gitignore inside a project repo.
  await writeFile(join(root, ".gitignore"), renderVaultGitignore());

  // Initialize git repo only for personal mode — project vaults live inside
  // an existing repo and should not create a nested repository.
  if (config.mode === "personal") {
    await execa("git", ["init"], { cwd: root });
    log.success("Initialized git repo");
  }

  // Create empty index files
  await writeFile(join(root, "wiki", "_index", "INDEX.md"), "# Index\n\nContent catalog — organized by category.\n");
  await writeFile(join(root, "wiki", "_index", "TAGS.md"), "# Tags\n\nAll tags with links to articles.\n");
  await writeFile(join(root, "wiki", "_index", "SOURCES.md"), "# Sources\n\nMaps raw/ files to wiki articles.\n");
  await writeFile(join(root, "wiki", "_index", "RECENT.md"), "# Recent Changes\n\nLast 20 changed articles.\n");
  await writeFile(join(root, "wiki", "_index", "LOG.md"), `# Log\n\n## [${new Date().toISOString().slice(0, 16).replace("T", " ")}] create | Knowledge base initialized\nCreated ${config.name} knowledge base (${config.mode} mode).\n`);

  // Configure Obsidian vault
  const obsidianDir = join(root, ".obsidian");
  await mkdir(obsidianDir, { recursive: true });

  await writeFile(
    join(obsidianDir, "community-plugins.json"),
    JSON.stringify(["obsidian-git", "omnisearch", "table-editor-obsidian", "text-extractor"], null, 2)
  );

  await writeFile(
    join(obsidianDir, "app.json"),
    JSON.stringify({
      defaultViewMode: "source",
      showLineNumber: true,
      useMarkdownLinks: false,
      // Hide operational metadata and source material from graph view,
      // search, and quick switcher. Both folders stay on disk and committed
      // to git — Obsidian just stops surfacing them as first-class notes.
      //
      // - wiki/_index/: LOG/RECENT/INDEX/TAGS/SOURCES are admin bookkeeping
      //   that auto-references nearly every article. Including them in the
      //   graph buries the real topical structure.
      // - raw/: immutable source material. Raw files contain unresolved
      //   links to external doc-site paths (e.g., /oss/javascript/...) that
      //   appear as broken-link clutter in the graph. Raw is the *input* to
      //   the wiki synthesis pipeline, not a browsable reference — wiki
      //   articles are the answer store. Users who need to open a raw file
      //   can do so via the file explorer; the graph view shouldn't include it.
      userIgnoreFilters: ["wiki/_index/", "raw/"],
    }, null, 2)
  );

  log.success("Configured Obsidian vault");
}

/**
 * Render the vault .gitignore.
 *
 * Two classes of files are ignored:
 *
 *   1. Machine-local Obsidian state under .obsidian/. Uses an allowlist
 *      pattern — ignore everything in .obsidian/ except the two files
 *      wikillm writes as shared vault config (app.json, community-plugins.json).
 *      Obsidian auto-generates many state files on first open (appearance.json,
 *      graph.json, core-plugins.json, workspace*, cache/, plugins-data/, and
 *      more), and enumerating them individually rots whenever Obsidian adds
 *      a new one. The allowlist guarantees only the two shared files ever
 *      make it into git, regardless of what Obsidian writes next.
 *
 *   2. OS junk (.DS_Store, Thumbs.db, *.tmp).
 *
 * Note on wiki/_index/ and raw/: both are committed but hidden from
 * Obsidian's first-class UI via `userIgnoreFilters` in app.json. LOG.md
 * and RECENT.md are churn-heavy but preserve cross-machine operation
 * history. raw/ holds immutable source material that would otherwise
 * dominate the graph view with unresolvable external doc-site links.
 * Hiding both folders via `userIgnoreFilters: ["wiki/_index/", "raw/"]`
 * keeps the graph, search, and quick switcher focused on compiled wiki
 * articles without throwing away git history or source provenance.
 *
 * Kept committed: wiki articles, all four wiki/_index files (INDEX.md,
 * TAGS.md, SOURCES.md, LOG.md, RECENT.md), outputs/, raw/, the vault
 * CLAUDE.md, and the two allowlisted Obsidian config files.
 */
function renderVaultGitignore(): string {
  return `# Machine-local Obsidian state (regenerated on vault open).
# Allowlist approach: ignore everything under .obsidian/ except the two
# files wikillm writes as shared vault config. This keeps personal settings
# like appearance.json, graph.json, workspace*, and plugin caches out of
# git automatically, including any new state files Obsidian adds in the
# future.
.obsidian/*
!.obsidian/app.json
!.obsidian/community-plugins.json

# OS junk
.DS_Store
Thumbs.db
*.tmp
`;
}
