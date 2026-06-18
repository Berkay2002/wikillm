import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { execa } from "execa";
import type { WikillmConfig } from "./prompts.js";
import { createAutomationMetadata } from "./automation.js";

export interface PlannedFile {
  path: string;
  content: string;
}

export interface VaultPlan {
  root: string;
  directories: string[];
  files: PlannedFile[];
  initializeGit: boolean;
}

export function createVaultPlan(config: WikillmConfig, now = new Date()): VaultPlan {
  const directories = [
    "raw/assets",
    "wiki/_index",
    ".obsidian",
  ];

  if (config.features.includes("slides")) directories.push("outputs/slides");
  if (config.features.includes("reports")) directories.push("outputs/reports");
  if (config.features.includes("visualizations")) directories.push("outputs/visualizations");

  const automationMetadata = createAutomationMetadata(config);
  if (automationMetadata) directories.push(".wikillm");

  const files: PlannedFile[] = [
    {
      path: ".gitignore",
      content: renderVaultGitignore(),
    },
    {
      path: "wiki/_index/INDEX.md",
      content: "# Index\n\nContent catalog - organized by category.\n",
    },
    {
      path: "wiki/_index/TAGS.md",
      content: "# Tags\n\nAll tags with links to articles.\n",
    },
    {
      path: "wiki/_index/SOURCES.md",
      content: "# Sources\n\nMaps raw/ files to wiki articles.\n",
    },
    {
      path: "wiki/_index/RECENT.md",
      content: "# Recent Changes\n\nLast 20 changed articles.\n",
    },
    {
      path: "wiki/_index/LOG.md",
      content: `# Log\n\n## [${formatLogTime(now)}] create | Knowledge base initialized\nCreated ${config.name} knowledge base (${config.mode} mode).\n`,
    },
    {
      path: ".obsidian/community-plugins.json",
      content: JSON.stringify(["obsidian-git", "omnisearch", "table-editor-obsidian", "text-extractor"], null, 2),
    },
    {
      path: ".obsidian/app.json",
      content: JSON.stringify({
        defaultViewMode: "source",
        showLineNumber: true,
        useMarkdownLinks: false,
        userIgnoreFilters: ["wiki/_index/", "raw/"],
      }, null, 2),
    },
  ];

  if (automationMetadata) {
    files.push({
      path: ".wikillm/automation.json",
      content: `${JSON.stringify(automationMetadata, null, 2)}\n`,
    });
  }

  return {
    root: config.path,
    directories,
    files,
    initializeGit: config.mode === "personal",
  };
}

export async function applyVaultPlan(plan: VaultPlan): Promise<void> {
  for (const directory of plan.directories) {
    await mkdir(join(plan.root, ...directory.split("/")), { recursive: true });
  }

  for (const file of plan.files) {
    await writeFile(join(plan.root, ...file.path.split("/")), file.content, "utf-8");
  }

  if (plan.initializeGit) {
    await execa("git", ["init"], { cwd: plan.root });
  }
}

export function renderVaultGitignore(): string {
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

function formatLogTime(date: Date): string {
  return date.toISOString().slice(0, 16).replace("T", " ");
}
