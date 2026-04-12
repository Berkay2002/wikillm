import { log } from "../utils/logger.js";

/**
 * Print instructions for installing the wikillm plugin in Claude Code.
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
export function printPluginInstallInstructions(): void {
  log.info("Enable wikillm in Claude Code with these slash commands:");
  log.step("  /plugin marketplace add Berkay2002/wikillm");
  log.step("  /plugin install wikillm@wikillm");
  log.step("  /reload-plugins");
  log.step("(Skip any you've already run — they're idempotent.)");
}

/**
 * Print instructions for updating the wikillm plugin in Claude Code.
 *
 * As with install, plugin updates happen inside Claude Code via slash commands,
 * not via the `npx wikillm` CLI. This function is called by `npx wikillm update`
 * to tell the user what to do.
 */
export function printPluginUpdateInstructions(): void {
  log.info("Update wikillm in Claude Code with these slash commands:");
  log.step("  /plugin marketplace update wikillm");
  log.step("  /reload-plugins");
  log.step("Run `npx wikillm@latest` to update the CLI itself.");
}
