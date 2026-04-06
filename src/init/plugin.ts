import { execa } from "execa";
import { log } from "../utils/logger.js";
import { PLUGIN_DIR } from "../utils/claude.js";

export async function installPlugin(): Promise<void> {
  log.step("Installing wikillm plugin...");

  try {
    await execa("claude", ["plugin", "install", "--dir", PLUGIN_DIR]);
    log.success("Plugin installed globally");
  } catch (error) {
    log.warn("Could not auto-install plugin. Install manually:");
    log.step(`claude --plugin-dir ${PLUGIN_DIR}`);
  }
}
