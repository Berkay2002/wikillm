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

  // Initialize git repo (only for personal mode — project mode already has one)
  if (config.mode === "personal") {
    await execa("git", ["init"], { cwd: root });
    await writeFile(
      join(root, ".gitignore"),
      ".DS_Store\n*.tmp\n"
    );
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
    }, null, 2)
  );

  log.success("Configured Obsidian vault");
}
