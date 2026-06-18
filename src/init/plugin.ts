import { log } from "../utils/logger.js";
import type { AgentHost } from "./hosts.js";
import { normalizeHosts, profileFor } from "./hosts.js";

/**
 * Print instructions for installing the wikillm plugin in Claude Code or Codex.
 *
 * The previous implementation shelled out to `claude plugin install --dir <path>`
 * which isn't a real Claude Code command — so the execa call always threw and the
 * "fallback" warning was the only thing that ever ran. Worse, the printed path
 * was a cache path that disappeared on the next `npx` run, so the fallback was
 * unactionable.
 *
 * The correct install path in Claude Code is via slash commands:
 *   /plugin marketplace add Berkay2002/wikillm
 *   /plugin install wikillm@wikillm
 *   /reload-plugins
 *
 * These are idempotent — running them when the plugin is already installed is
 * a no-op, so we print them unconditionally as part of the init next-steps
 * block. The user copies them into an active Claude Code session.
 */
export function printPluginInstallInstructions(hosts: AgentHost[] = ["claude"]): void {
  for (const host of normalizeHosts(hosts)) {
    const profile = profileFor(host);
    log.info(profile.installIntro);
    for (const step of profile.installSteps) {
      log.step(`  ${step}`);
    }
  }
}

/**
 * Print instructions for updating the wikillm plugin in Claude Code.
 *
 * As with install, plugin updates happen inside Claude Code via slash commands,
 * not via the `npx wikillm` CLI. This function is called by `npx wikillm update`
 * to tell the user what to do.
 */
export function printPluginUpdateInstructions(): void {
  for (const host of normalizeHosts(["claude", "codex"])) {
    const profile = profileFor(host);
    log.info(profile.updateIntro);
    for (const step of profile.updateSteps) {
      log.step(`  ${step}`);
    }
  }
  log.step("Run `npx wikillm@latest` to update the CLI itself.");
}
