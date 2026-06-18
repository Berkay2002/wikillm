import type { WikillmConfig } from "./prompts.js";
import type { AgentHost } from "./hosts.js";
import { automationRuntimesFor, commandsForHosts, commandSetFor, normalizeHosts } from "./hosts.js";

export type AutomationKind = "manual" | "none" | "guided";
export type AutomationFrequency = NonNullable<WikillmConfig["schedule"]>["ingestFrequency"];

export interface AutomationPlan {
  kind: AutomationKind;
  commands: string[];
  ingestFrequency?: AutomationFrequency;
  lint: boolean;
  metadataPath?: string;
}

export interface AutomationMetadata {
  version: 1;
  mode: WikillmConfig["mode"];
  hosts: AgentHost[];
  schedule: NonNullable<WikillmConfig["schedule"]>;
  commands: string[];
  claudeScheduledTaskPrompt?: string;
  codexAutomationPrompt?: string;
  note: string;
}

export function createAutomationPlan(config: WikillmConfig): AutomationPlan {
  if (config.mode === "project-team") {
    return {
      kind: "manual",
      commands: [],
      lint: false,
    };
  }

  if (!config.schedule) {
    return {
      kind: "none",
      commands: [],
      lint: false,
    };
  }

  const commands = commandsForHosts(config.hosts, "ingest");
  if (config.schedule.lint) {
    commands.push(...commandsForHosts(config.hosts, "lint"));
  }

  return {
    kind: "guided",
    commands,
    ingestFrequency: config.schedule.ingestFrequency,
    lint: config.schedule.lint,
    metadataPath: ".wikillm/automation.json",
  };
}

export function createAutomationMetadata(config: WikillmConfig): AutomationMetadata | undefined {
  const plan = createAutomationPlan(config);
  if (plan.kind !== "guided" || !config.schedule) return undefined;

  const hosts = normalizeHosts(config.hosts);
  return {
    version: 1,
    mode: config.mode,
    hosts,
    schedule: config.schedule,
    commands: plan.commands,
    claudeScheduledTaskPrompt: hosts.includes("claude")
      ? renderClaudeScheduledTaskPrompt(config)
      : undefined,
    codexAutomationPrompt: hosts.includes("codex")
      ? renderCodexAutomationPrompt(config)
      : undefined,
    note: "wikillm records automation guidance here. Configure the selected agent host to run these commands; the CLI does not install host automations.",
  };
}

export function renderAutomationSection(config: WikillmConfig, host: AgentHost): string {
  const commands = commandSetFor(host);
  const plan = createAutomationPlan(config);

  if (plan.kind === "manual") {
    return `**Manual only.** Team mode disables automated runs to avoid merge conflicts from parallel ingest runs. When you add sources:

- Pull the latest \`main\` first
- Run \`${commands.ingest}\` locally
- Review the wiki changes before committing
- Push and coordinate with the team

For health checks, run \`${commands.lint}\` manually on a cadence that suits the team.`;
  }

  if (plan.kind === "none") {
    return `No automation guidance configured. Run \`${commands.ingest}\` manually after adding sources to \`raw/\`, and \`${commands.lint}\` periodically for health checks.`;
  }

  const lintLine = plan.lint
    ? `- **Weekly lint** - configure ${automationRuntimesFor([host])} to run \`${commands.lint}\` weekly.`
    : "";
  const codexCreationLine = host === "codex"
    ? "\nFor Codex, paste the `codexAutomationPrompt` from `.wikillm/automation.json` into a regular Codex thread and ask Codex to create a standalone project automation. Test the prompt manually before scheduling it."
    : "";
  const claudeCreationLine = host === "claude"
    ? "\nFor Claude Code Desktop, paste the `claudeScheduledTaskPrompt` from `.wikillm/automation.json` into any Desktop session and ask Claude to create a local scheduled task. Run it once immediately to approve permissions and check the output."
    : "";

  return `Automation guidance is recorded in \`${plan.metadataPath}\`. Configure ${automationRuntimesFor([host])} to run these commands; \`npx wikillm\` records the plan but does not install host automations.

- **${titleCase(plan.ingestFrequency ?? "scheduled")} ingestion** - configure ${automationRuntimesFor([host])} to run \`${commands.ingest}\` ${plan.ingestFrequency}. If there are no new files, the ingest skill exits without changes.
${lintLine}
${claudeCreationLine}
${codexCreationLine}

Manual \`${commands.ingest}\` and \`${commands.lint}\` runs remain the source of truth.`;
}

export function renderAutomationNextSteps(config: WikillmConfig): string[] {
  const plan = createAutomationPlan(config);
  if (plan.kind !== "guided") return [];

  const lines = [
    `Automation guidance written to ${config.path}/${plan.metadataPath}`,
    `Configure ${automationRuntimesFor(config.hosts)} to run ${commandsForHosts(config.hosts, "ingest").join(" or ")} ${plan.ingestFrequency}.`,
  ];

  if (plan.lint) {
    lines.push(`Configure weekly lint with ${commandsForHosts(config.hosts, "lint").join(" or ")}.`);
  }
  if (normalizeHosts(config.hosts).includes("claude")) {
    lines.push("For Claude Code Desktop, paste the generated prompt from .wikillm/automation.json into any Desktop session and ask Claude to create a local scheduled task.");
  }
  if (normalizeHosts(config.hosts).includes("codex")) {
    lines.push("For Codex, paste the generated prompt from .wikillm/automation.json into a regular Codex thread and ask Codex to create the automation.");
  }

  return lines;
}

export function renderClaudeScheduledTaskPrompt(config: WikillmConfig): string {
  const plan = createAutomationPlan(config);
  if (plan.kind !== "guided") {
    return "No Claude scheduled task prompt is available because this vault does not have automation guidance enabled.";
  }

  const lintLine = plan.lint
    ? "- Run `/wikillm:lint` weekly as part of the same scheduled task or as a second local scheduled task.\n"
    : "";

  return `Create a local scheduled task in Claude Code Desktop for this wikillm vault.

Working folder: ${config.path}
Schedule: ${plan.ingestFrequency}

Run mode:
- Use the current working directory if new raw files are usually uncommitted in \`${config.path}/raw/\`.
- Enable the worktree toggle if raw sources are committed before each run and you want to isolate automation changes from unfinished local work.

Instructions:
Run \`/wikillm:ingest\` for this vault. If there are no new files in \`raw/\`, finish with a short "nothing to report" summary. If ingest changes wiki files or indices, summarize the files changed and leave the scheduled session available for review.
${lintLine}- If there are 3+ new sources, dispatch the bundled \`ingest-worker\` subagent per source, wait for all workers, then reconcile.
- Use the installed wikillm skills rather than reimplementing the workflow.
- Run now after creating the task, watch for permission prompts, and save "always allow" only for the tools this task actually needs.
- Local scheduled tasks run only while Claude Code Desktop is open and the computer is awake. Enable Keep computer awake in Desktop settings if missed runs are unacceptable.`;
}

export function renderCodexAutomationPrompt(config: WikillmConfig): string {
  const plan = createAutomationPlan(config);
  if (plan.kind !== "guided") {
    return "No Codex automation prompt is available because this vault does not have automation guidance enabled.";
  }

  const lintLine = plan.lint
    ? "- Run `$wikillm:lint` weekly as part of the same automation or as a second standalone automation.\n"
    : "";

  return `Create a standalone project automation for this wikillm vault.

Project path: ${config.path}
Schedule: ${plan.ingestFrequency}

Run mode:
- Use local project mode if new raw files are usually uncommitted in \`${config.path}/raw/\`.
- Use a dedicated background worktree if raw sources are committed before each run and you want to isolate automation changes from unfinished local work.

Prompt:
Run \`$wikillm:ingest\` for this vault. If there are no new files in \`raw/\`, archive the run without findings. If the ingest changes wiki files or indices, summarize the files changed and leave the run in Triage for review.
${lintLine}- If there are 3+ new sources, explicitly spawn one subagent per source using the ingest-worker prompt, wait for all workers, then reconcile.
- Use the installed wikillm skills rather than reimplementing the workflow.
- Test this prompt manually in a regular Codex thread before scheduling, then review the first few runs.
- Remember that Codex automations use the default sandbox settings and normally use \`approval_policy = "never"\` when policy allows it.`;
}

export function automationPromptMessage(mode: WikillmConfig["mode"]): string {
  if (mode === "project-team") {
    return "Team mode uses manual ingestion to avoid merge conflicts.";
  }
  return "Write automation guidance? (the CLI records commands; you configure the selected agent app to run them)";
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
