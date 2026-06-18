import { writeFile, access } from "fs/promises";
import { join, resolve } from "path";
import { log } from "../utils/logger.js";
import { renderAgentsMd, renderClaudeMd } from "./claude-md-template.js";
import type { WikillmConfig } from "./prompts.js";
import { normalizeHosts, schemaFileNameFor } from "./hosts.js";

/**
 * Generate the vault's host schema files in-process.
 *
 * This function is synchronous to the init flow — it renders a deterministic
 * template and writes it immediately, then verifies each file landed. The
 * previous implementation shelled out to `claude --print /wikillm:generate-schema`
 * as a subprocess, which silently failed when the plugin wasn't enabled in
 * the subprocess's settings and logged "CLAUDE.md generated" regardless.
 *
 * We still ship the generate-schema skill for on-demand
 * regeneration by an interactive agent session — but init no longer
 * depends on a subprocess that might never run.
 */
export async function generateSchema(config: WikillmConfig): Promise<void> {
  log.step("Generating your knowledge base schema...");

  assertVaultPathIsSafe(config);

  for (const target of schemaTargetsFor(config)) {
    await writeFile(target.path, target.content, "utf-8");
    await access(target.path);

    log.success(`${target.fileName} written to ${target.path}`);
  }
}

function schemaTargetsFor(config: WikillmConfig): Array<{ fileName: string; path: string; content: string }> {
  const hosts = normalizeHosts(config.hosts);
  const targets: Array<{ fileName: string; path: string; content: string }> = [];

  if (hosts.includes("claude")) {
    targets.push({
      fileName: schemaFileNameFor("claude"),
      path: join(config.path, schemaFileNameFor("claude")),
      content: renderClaudeMd(config),
    });
  }

  if (hosts.includes("codex")) {
    targets.push({
      fileName: schemaFileNameFor("codex"),
      path: join(config.path, schemaFileNameFor("codex")),
      content: renderAgentsMd(config),
    });
  }

  return targets;
}

/**
 * Refuse to write schema files if the vault path resolves to the current working
 * directory. In project mode, the user's project almost certainly has its own
 * root CLAUDE.md or AGENTS.md, and clobbering either would be destructive and
 * invisible.
 *
 * The vault schema lives under the vault root (e.g. `.kb/CLAUDE.md` or
 * `.kb/AGENTS.md`), never at the repo root.
 */
function assertVaultPathIsSafe(config: WikillmConfig): void {
  if (config.mode === "personal") return;

  const vaultAbs = resolve(config.path);
  const cwdAbs = resolve(process.cwd());

  if (vaultAbs === cwdAbs) {
    throw new Error(
      `Refusing to write agent schema files into the project root (${cwdAbs}). ` +
        `In project mode, the vault must be a subdirectory (default: .kb/) so the ` +
        `project's own root instructions are not overwritten. Re-run 'npx wikillm' and choose ` +
        `a vault path inside the project (e.g. .kb, docs/kb, .wikillm).`
    );
  }
}
