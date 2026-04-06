import { execa } from "execa";
import { confirm } from "@inquirer/prompts";
import { log } from "../utils/logger.js";

export async function checkClaude(): Promise<boolean> {
  try {
    await execa("claude", ["--version"]);
    log.success("Claude Code detected");
    return true;
  } catch {
    log.error("Claude Code not found");
    log.step("Install it: https://docs.anthropic.com/en/docs/claude-code/overview");
    return false;
  }
}

export async function checkObsidian(): Promise<boolean> {
  try {
    await execa("obsidian", ["version"]);
    log.success("Obsidian CLI detected");
    return true;
  } catch {
    log.warn("Obsidian CLI not found — KB will work without it, but you'll miss graph view and search");
    return false;
  }
}

export async function checkMarp(): Promise<boolean> {
  try {
    await execa("marp", ["--version"]);
    log.success("Marp CLI detected");
    return true;
  } catch {
    const install = await confirm({
      message: "Marp CLI not found. Install it?",
      default: true,
    });
    if (install) {
      await execa("npm", ["install", "-g", "@marp-team/marp-cli"]);
      log.success("Marp CLI installed");
      return true;
    }
    log.warn("Marp CLI skipped — slide generation won't work until installed");
    return false;
  }
}

export async function checkDependencies(features: string[]): Promise<boolean> {
  const claudeOk = await checkClaude();
  if (!claudeOk) return false;

  await checkObsidian();

  if (features.includes("slides")) {
    await checkMarp();
  }

  return true;
}
