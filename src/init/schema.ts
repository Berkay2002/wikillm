import { writeFile, access } from "fs/promises";
import { join, resolve } from "path";
import { log } from "../utils/logger.js";
import { renderClaudeMd } from "./claude-md-template.js";
import type { WikillmConfig } from "./prompts.js";

/**
 * Generate the vault's CLAUDE.md in-process.
 *
 * This function is synchronous to the init flow — it renders a deterministic
 * template and writes it immediately, then verifies the file landed. The
 * previous implementation shelled out to `claude --print /wikillm:generate-schema`
 * as a subprocess, which silently failed when the plugin wasn't enabled in
 * the subprocess's settings and logged "CLAUDE.md generated" regardless.
 *
 * We still ship the `/wikillm:generate-schema` skill for on-demand
 * regeneration by an interactive Claude Code session — but init no longer
 * depends on a subprocess that might never run.
 */
export async function generateSchema(config: WikillmConfig): Promise<void> {
  log.step("Generating your knowledge base schema...");

  assertVaultPathIsSafe(config);

  const target = join(config.path, "CLAUDE.md");
  const content = renderClaudeMd(config);

  await writeFile(target, content, "utf-8");

  // Belt-and-braces: verify the file is actually there before claiming success.
  // If this throws, the catch in main() will surface a clear error instead of
  // the "CLAUDE.md generated" lie the old implementation used to print.
  await access(target);

  log.success(`CLAUDE.md written to ${target}`);
}

/**
 * Refuse to write CLAUDE.md if the vault path resolves to the current working
 * directory. In project mode, the user's project almost certainly has its own
 * root CLAUDE.md, and clobbering it would be destructive and invisible.
 *
 * The vault CLAUDE.md is the schema for the knowledge base — it lives at
 * `<vault>/CLAUDE.md` (e.g. `.kb/CLAUDE.md`), never at the repo root.
 */
function assertVaultPathIsSafe(config: WikillmConfig): void {
  if (config.mode === "personal") return;

  const vaultAbs = resolve(config.path);
  const cwdAbs = resolve(process.cwd());

  if (vaultAbs === cwdAbs) {
    throw new Error(
      `Refusing to write CLAUDE.md into the project root (${cwdAbs}). ` +
        `In project mode, the vault must be a subdirectory (default: .kb/) so the ` +
        `project's own CLAUDE.md is not overwritten. Re-run 'npx wikillm' and choose ` +
        `a vault path inside the project (e.g. .kb, docs/kb, .wikillm).`
    );
  }
}
