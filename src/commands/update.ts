import { log } from "../utils/logger.js";
import { printPluginUpdateInstructions } from "../init/plugin.js";

export async function update(): Promise<void> {
  log.title("  wikillm update\n");
  printPluginUpdateInstructions();
}
