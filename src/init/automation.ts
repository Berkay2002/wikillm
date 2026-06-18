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

  return {
    version: 1,
    mode: config.mode,
    hosts: normalizeHosts(config.hosts),
    schedule: config.schedule,
    commands: plan.commands,
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

  return `Automation guidance is recorded in \`${plan.metadataPath}\`. Configure ${automationRuntimesFor([host])} to run these commands; \`npx wikillm\` records the plan but does not install host automations.

- **${titleCase(plan.ingestFrequency ?? "scheduled")} ingestion** - configure ${automationRuntimesFor([host])} to run \`${commands.ingest}\` ${plan.ingestFrequency}. If there are no new files, the ingest skill exits without changes.
${lintLine}

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

  return lines;
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
