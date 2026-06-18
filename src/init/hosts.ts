export type AgentHost = "claude" | "codex";

export interface CommandSet {
  ingest: string;
  query: string;
  lint: string;
  marp: string;
  usingWikillm: string;
}

export interface HostProfile {
  id: AgentHost;
  label: string;
  schemaFileName: string;
  rootInstructionFileName: string;
  commandPrefix: string;
  automationRuntime: string;
  installIntro: string;
  installSteps: string[];
  updateIntro: string;
  updateSteps: string[];
}

export const hostProfiles: Record<AgentHost, HostProfile> = {
  claude: {
    id: "claude",
    label: "Claude Code",
    schemaFileName: "CLAUDE.md",
    rootInstructionFileName: "CLAUDE.md",
    commandPrefix: "/wikillm:",
    automationRuntime: "Claude Desktop",
    installIntro: "Enable wikillm in Claude Code with these slash commands:",
    installSteps: [
      "/plugin marketplace add Berkay2002/wikillm",
      "/plugin install wikillm@wikillm",
      "/reload-plugins",
      "(Skip any you've already run - they're idempotent.)",
    ],
    updateIntro: "Update wikillm in Claude Code with these slash commands:",
    updateSteps: [
      "/plugin marketplace update wikillm",
      "/reload-plugins",
    ],
  },
  codex: {
    id: "codex",
    label: "Codex",
    schemaFileName: "AGENTS.md",
    rootInstructionFileName: "AGENTS.md",
    commandPrefix: "$wikillm:",
    automationRuntime: "the Codex app",
    installIntro: "Enable wikillm in Codex by adding this repo as a plugin marketplace:",
    installSteps: [
      "codex plugin marketplace add Berkay2002/wikillm",
      "# or, for a local checkout: codex plugin marketplace add ./path/to/wikillm",
      "Then install wikillm from the Codex plugin directory and start a new thread.",
    ],
    updateIntro: "For Codex, update the marketplace source and refresh it:",
    updateSteps: [
      "codex plugin marketplace list",
      "codex plugin marketplace upgrade wikillm",
      "Then restart Codex or start a new thread so the refreshed plugin copy is used.",
    ],
  },
};

export function normalizeHosts(hosts: AgentHost[] | undefined): AgentHost[] {
  if (!hosts || hosts.length === 0) return ["claude"];

  const seen = new Set<AgentHost>();
  const normalized: AgentHost[] = [];
  for (const host of hosts) {
    if (!seen.has(host)) {
      seen.add(host);
      normalized.push(host);
    }
  }
  return normalized;
}

export function profileFor(host: AgentHost): HostProfile {
  return hostProfiles[host];
}

export function commandFor(host: AgentHost, skill: string): string {
  return `${profileFor(host).commandPrefix}${skill}`;
}

export function commandSetFor(host: AgentHost): CommandSet {
  return {
    ingest: commandFor(host, "ingest"),
    query: commandFor(host, "query"),
    lint: commandFor(host, "lint"),
    marp: commandFor(host, "marp-cli"),
    usingWikillm: commandFor(host, "using-wikillm"),
  };
}

export function commandsForHosts(hosts: AgentHost[] | undefined, skill: string): string[] {
  return normalizeHosts(hosts).map((host) => commandFor(host, skill));
}

export function schemaFileNameFor(host: AgentHost): string {
  return profileFor(host).schemaFileName;
}

export function rootInstructionFilesFor(hosts: AgentHost[] | undefined): string {
  return joinHumanList(normalizeHosts(hosts).map((host) => profileFor(host).rootInstructionFileName));
}

export function automationRuntimesFor(hosts: AgentHost[] | undefined): string {
  return joinHumanList(normalizeHosts(hosts).map((host) => profileFor(host).automationRuntime));
}

export function labelForHost(host: AgentHost): string {
  return profileFor(host).label;
}

function joinHumanList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
