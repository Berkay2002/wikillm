#!/usr/bin/env node

import { log } from "./utils/logger.js";
import { runPrompts, type WikillmConfig } from "./init/prompts.js";
import { checkDependencies } from "./init/dependencies.js";
import { scaffold } from "./init/scaffold.js";
import { generateSchema } from "./init/schema.js";
import { printPluginInstallInstructions } from "./init/plugin.js";
import { doctor } from "./commands/doctor.js";
import { update } from "./commands/update.js";

const args = process.argv.slice(2);
const command = args[0] || "init";

async function main() {
  switch (command) {
    case "init":
      await init();
      break;
    case "doctor":
      await doctor();
      break;
    case "update":
      await update();
      break;
    case "--help":
    case "-h":
      log.title("  wikillm — LLM-maintained knowledge bases\n");
      log.info("Commands:");
      log.step("  init     Interactive setup (default)");
      log.step("  doctor   Check dependencies and vault health");
      log.step("  update   Print instructions to update the plugin");
      break;
    default:
      log.error(`Unknown command: ${command}`);
      log.step("Run 'wikillm --help' for available commands");
      process.exit(1);
  }
}

async function init() {
  log.title("  wikillm — LLM-maintained knowledge bases\n");

  const config = await runPrompts();

  log.title("  Checking dependencies...\n");
  const ok = await checkDependencies(config.features);
  if (!ok) {
    log.error("Claude Code is required. Install it first.");
    process.exit(1);
  }

  log.title("  Setting up your knowledge base...\n");
  await scaffold(config);
  await generateSchema(config);

  printNextSteps(config);
}

/**
 * Print the post-init next-steps block.
 *
 * Previously the init flow ended with a one-line "Open your vault in Obsidian"
 * tip, which left first-time users guessing at the actual workflow (drop files
 * in raw/, run ingest, wire up the project CLAUDE.md). This function prints
 * the real checklist so the user can go straight from `npx wikillm` to a
 * working KB.
 */
function printNextSteps(config: WikillmConfig): void {
  log.title("\n  Next steps\n");

  log.info("1. Enable the wikillm plugin in Claude Code:");
  printPluginInstallInstructions();

  log.info("\n2. Add source material to your KB:");
  log.step(`   Drop reference docs, PDFs, or blog posts into ${config.path}/raw/`);
  log.step("   Keep meaningful subfolders under raw/ (e.g. raw/langchain/, raw/api-specs/)");

  log.info("\n3. Compile the wiki:");
  log.step("   /wikillm:ingest");
  log.step("   Runs concept extraction, cross-links articles, updates indices, commits.");

  if (config.mode === "project-solo" || config.mode === "project-team") {
    log.info("\n4. Wire the KB into your project's CLAUDE.md:");
    log.step("   Append a 'Knowledge Base' section to your project's root CLAUDE.md so");
    log.step("   future Claude Code sessions know to query the wiki. See the");
    log.step("   using-wikillm skill for the exact snippet — or just ask Claude");
    log.step("   to 'set up the wikillm integration section' after /reload-plugins.");
    log.info("\n5. Smoke test:");
  } else {
    log.info("\n4. Smoke test:");
  }

  log.step("   /wikillm:query \"a question you already know the answer to\"");
  log.step("   If the answer is right, you're done. If not, run /wikillm:lint.");

  if (config.schedule) {
    log.info("\nScheduled automation configured:");
    log.step(`  Ingest: ${config.schedule.ingestFrequency}`);
    if (config.schedule.lint) log.step("  Lint: weekly");
    log.step("  Note: scheduled tasks require Claude Desktop to be running.");
  }

  log.title(`\n  Vault ready at ${config.path}`);
  log.step(`Open in Obsidian: obsidian open vault="${config.name}"`);
  log.step("Full orientation: /wikillm:using-wikillm (once the plugin is enabled)\n");
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
