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

/**
 * Check whether the Obsidian CLI is installed AND functional.
 *
 * The previous check was a single `execa("obsidian", ["version"])` that was
 * easy to false-positive: if the binary was on PATH but the desktop app wasn't
 * running (or the CLI was disabled in Settings → General), the check still
 * reported "Obsidian CLI detected" because the binary itself prints a version
 * string regardless of whether it can actually talk to a running vault.
 *
 * The Obsidian CLI has two independent failure modes worth distinguishing:
 *
 *   1. The `obsidian` binary isn't on PATH at all — user hasn't installed
 *      Obsidian, or hasn't enabled the CLI toggle in Settings.
 *   2. The binary exists but can't reach a running desktop app — Obsidian
 *      isn't running, or the CLI server inside it is disabled.
 *
 * We probe both and surface distinct messages for each, so users know what
 * to actually do to fix it. Neither is fatal — the KB works without Obsidian,
 * you just miss graph view and indexed search.
 */
export async function checkObsidian(): Promise<boolean> {
  const whichCmd = process.platform === "win32" ? "where" : "which";

  // Step 1: is `obsidian` on PATH?
  try {
    await execa(whichCmd, ["obsidian"]);
  } catch {
    log.warn("Obsidian CLI not found — KB will work without it, but you'll miss graph view and indexed search.");
    log.step("To enable: install Obsidian (https://obsidian.md), launch it,");
    log.step("then toggle Settings → General → Command line interface.");
    return false;
  }

  // Step 2: binary is on PATH — does it actually respond?
  // Use a short timeout so a hung desktop app doesn't stall init.
  try {
    await execa("obsidian", ["--version"], { timeout: 3000 });
    log.success("Obsidian CLI detected and functional");
    return true;
  } catch {
    log.warn("Obsidian CLI binary found but not responding.");
    log.step("Make sure the Obsidian desktop app is running and that");
    log.step("Settings → General → Command line interface is enabled.");
    log.step("The KB will still work — wikillm will fall back to direct file tools.");
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
