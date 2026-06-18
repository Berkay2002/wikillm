import { access } from "fs/promises";
import { confirm } from "@inquirer/prompts";
import { log } from "../utils/logger.js";
import type { WikillmConfig } from "./prompts.js";
import { applyVaultPlan, createVaultPlan } from "./vault-plan.js";

export async function scaffold(config: WikillmConfig): Promise<void> {
  const root = config.path;

  let rootExists = false;
  try {
    await access(root);
    rootExists = true;
  } catch {
    rootExists = false;
  }

  if (rootExists) {
    const overwrite = await confirm({
      message: `${root} already exists. Overwrite?`,
      default: false,
    });
    if (!overwrite) {
      throw new Error("Aborted. Choose a different location.");
    }
  }

  const plan = createVaultPlan(config);
  await applyVaultPlan(plan);
  log.success("Created folder structure");
  if (plan.initializeGit) log.success("Initialized git repo");
  log.success("Configured Obsidian vault");
}
