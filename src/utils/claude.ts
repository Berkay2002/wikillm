import { execa } from "execa";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PLUGIN_DIR = resolve(__dirname, "..", "plugin");

export async function isClaudeInstalled(): Promise<boolean> {
  try {
    await execa("claude", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

export async function invokeClaudeWithSkill(
  skill: string,
  args: string,
  cwd: string
): Promise<string> {
  const result = await execa(
    "claude",
    [
      "--print",
      "--plugin-dir",
      PLUGIN_DIR,
      `/${skill} ${args}`,
    ],
    { cwd }
  );
  return result.stdout;
}
