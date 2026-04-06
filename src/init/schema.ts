import { log } from "../utils/logger.js";
import { invokeClaudeWithSkill } from "../utils/claude.js";
import type { WikillmConfig } from "./prompts.js";

export async function generateSchema(config: WikillmConfig): Promise<void> {
  log.step("Generating your knowledge base schema via Claude...");

  const args = [
    `--name ${config.name}`,
    `--mode ${config.mode}`,
    `--path ${config.path}`,
    `--features ${config.features.join(",")}`,
  ];

  if (config.domain) {
    args.push(`--domain "${config.domain}"`);
  }

  await invokeClaudeWithSkill(
    "wikillm:generate-schema",
    args.join(" "),
    config.path
  );

  log.success("CLAUDE.md generated");
}
