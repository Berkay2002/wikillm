import { log } from "../utils/logger.js";
import { checkClaude, checkObsidian } from "../init/dependencies.js";
import { execa } from "execa";
import { inspectVault, type VaultDiagnostic } from "./vault-inspector.js";

export async function doctor(): Promise<void> {
  log.title("  wikillm doctor\n");

  const inspection = await inspectVault();
  for (const diagnostic of inspection.diagnostics) {
    printDiagnostic(diagnostic);
  }

  if (inspection.hosts.includes("claude")) {
    await checkClaude();
  }
  if (inspection.hosts.includes("codex")) {
    log.step("Codex target detected; install the Codex plugin in the Codex app if skills are missing.");
  }

  await checkObsidian();

  if (inspection.features.includes("slides")) {
    try {
      await execa("marp", ["--version"]);
      log.success("Marp CLI detected");
    } catch {
      log.warn("Marp CLI not found");
    }
  }
}

function printDiagnostic(diagnostic: VaultDiagnostic): void {
  const message = diagnostic.path
    ? `${diagnostic.message} (${diagnostic.path})`
    : diagnostic.message;

  switch (diagnostic.severity) {
    case "ok":
      log.success(message);
      break;
    case "warn":
      log.warn(message);
      break;
    case "error":
      log.error(message);
      break;
  }
}
