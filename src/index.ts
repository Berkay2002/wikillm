#!/usr/bin/env node

import { log } from "./utils/logger.js";
import { runPrompts } from "./init/prompts.js";
import { checkDependencies } from "./init/dependencies.js";
import { scaffold } from "./init/scaffold.js";
import { generateSchema } from "./init/schema.js";
import { installPlugin } from "./init/plugin.js";
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
      log.step("  update   Update the plugin to latest");
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
  await installPlugin();

  // Display schedule config if set
  if (config.schedule) {
    log.step("Scheduled automation configured:");
    log.step(`  Ingest: ${config.schedule.ingestFrequency}`);
    if (config.schedule.lint) log.step("  Lint: weekly");
    log.warn("Note: Scheduled tasks require Claude Desktop to be running.");
  }

  log.title("\n  Done! Open your vault in Obsidian:");
  log.info(`obsidian open vault="${config.name}"\n`);
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
