import { existsSync } from "fs";
import { log } from "../utils/logger.js";
import { checkClaude, checkObsidian } from "../init/dependencies.js";
import { execa } from "execa";

export async function doctor(): Promise<void> {
  log.title("  wikillm doctor\n");

  // Check dependencies (doctor only checks presence, doesn't offer to install)
  await checkClaude();
  await checkObsidian();
  try {
    await execa("marp", ["--version"]);
    log.success("Marp CLI detected");
  } catch {
    log.warn("Marp CLI not found");
  }

  // Check if we're in a KB vault
  if (existsSync("CLAUDE.md") && existsSync("wiki/_index/INDEX.md")) {
    log.success("Valid KB vault detected in current directory");

    // Check index files exist
    const indices = ["INDEX.md", "TAGS.md", "SOURCES.md", "RECENT.md", "LOG.md"];
    for (const idx of indices) {
      if (existsSync(`wiki/_index/${idx}`)) {
        log.success(`wiki/_index/${idx} exists`);
      } else {
        log.error(`wiki/_index/${idx} missing`);
      }
    }
  } else if (existsSync(".kb/CLAUDE.md")) {
    log.success("Valid project KB detected (.kb/)");
  } else {
    log.warn("No KB vault detected in current directory");
  }
}
