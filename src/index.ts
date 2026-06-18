#!/usr/bin/env node

import { log } from "./utils/logger.js";
import { runPrompts, type WikillmConfig } from "./init/prompts.js";
import { checkDependencies } from "./init/dependencies.js";
import { scaffold } from "./init/scaffold.js";
import { generateSchema } from "./init/schema.js";
import { printPluginInstallInstructions } from "./init/plugin.js";
import { doctor } from "./commands/doctor.js";
import { update } from "./commands/update.js";
import type { AgentHost } from "./init/prompts.js";

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
  const ok = await checkDependencies(config.features, config.hosts);
  if (!ok) {
    log.error("A selected agent host is missing a required dependency. Install it first.");
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
 * in raw/, run ingest, wire up the project root instructions). This function prints
 * the real checklist so the user can go straight from `npx wikillm` to a
 * working KB.
 */
function printNextSteps(config: WikillmConfig): void {
  log.title("\n  Next steps\n");

  log.info("1. Enable the wikillm plugin in your selected agent host:");
  printPluginInstallInstructions(config.hosts);

  log.info("\n2. Add source material to your KB:");
  log.step(`   Drop reference docs, PDFs, or blog posts into ${config.path}/raw/`);
  log.step("   Keep meaningful subfolders under raw/ (e.g. raw/langchain/, raw/api-specs/)");

  log.info("\n3. Compile the wiki:");
  for (const command of commandsFor(config.hosts, "ingest")) {
    log.step(`   ${command}`);
  }
  log.step("   Runs concept extraction, cross-links articles, updates indices, commits.");

  if (config.mode === "project-solo" || config.mode === "project-team") {
    log.info("\n4. Wire the KB into your project's root agent instructions:");
    log.step(`   Update ${rootInstructionFiles(config.hosts)} so future agent sessions know`);
    log.step("   to query the wiki. See the using-wikillm skill for the exact snippet.");
    log.info("\n5. Smoke test:");
  } else {
    log.info("\n4. Smoke test:");
  }

  for (const command of commandsFor(config.hosts, "query")) {
    log.step(`   ${command} "a question you already know the answer to"`);
  }
  log.step(`   If the answer is right, you're done. If not, run ${commandsFor(config.hosts, "lint").join(" or ")}.`);

  if (config.schedule) {
    log.info("\nScheduled automation configured:");
    log.step(`  Ingest: ${config.schedule.ingestFrequency}`);
    if (config.schedule.lint) log.step("  Lint: weekly");
    log.step(`  Note: scheduled tasks require ${automationRuntime(config.hosts)} to be running.`);
  }

  log.title(`\n  Vault ready at ${config.path}`);
  log.step(`Open in Obsidian: obsidian open vault="${config.name}"`);
  log.step(`Full orientation: ${commandsFor(config.hosts, "using-wikillm").join(" or ")} (once the plugin is enabled)\n`);
}

function commandsFor(hosts: AgentHost[], skill: string): string[] {
  const selectedHosts = hosts.length > 0 ? hosts : ["claude" as AgentHost];
  return selectedHosts.map((host) => `${host === "claude" ? "/wikillm:" : "$wikillm:"}${skill}`);
}

function rootInstructionFiles(hosts: AgentHost[]): string {
  const selectedHosts = hosts.length > 0 ? hosts : ["claude" as AgentHost];
  const files = selectedHosts.map((host) => host === "claude" ? "CLAUDE.md" : "AGENTS.md");
  return files.join(" and ");
}

function automationRuntime(hosts: AgentHost[]): string {
  const selectedHosts = hosts.length > 0 ? hosts : ["claude" as AgentHost];
  const runtimes = selectedHosts.map((host) => host === "claude" ? "Claude Desktop" : "the Codex app");
  return runtimes.join(" and ");
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
