import { log } from "../utils/logger.js";
import { installPlugin } from "../init/plugin.js";

export async function update(): Promise<void> {
  log.title("  wikillm update\n");
  await installPlugin();
  log.success("Plugin updated to latest version");
}
