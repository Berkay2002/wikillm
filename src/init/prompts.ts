import { input, select, checkbox, confirm } from "@inquirer/prompts";

export interface WikillmConfig {
  name: string;
  mode: "personal" | "project-solo" | "project-team";
  path: string;
  features: string[];
  domain?: string;
  schedule?: {
    ingestFrequency: "hourly" | "daily" | "weekdays" | "weekly";
    lint: boolean;
  };
}

export async function runPrompts(): Promise<WikillmConfig> {
  const name = await input({
    message: "What's the name of your knowledge base?",
    validate: (v) => (v.trim() ? true : "Name is required"),
  });

  const kind = await select({
    message: "What kind of knowledge base?",
    choices: [
      { name: "Personal — your brain extension", value: "personal" as const },
      { name: "Project — shared knowledge for a codebase", value: "project" as const },
    ],
  });

  let mode: WikillmConfig["mode"];
  let path: string;

  if (kind === "personal") {
    mode = "personal";
    const homeDir = process.env.HOME || "~";
    const defaultPath = `${homeDir}/.wikillm/${name}`;
    const location = await select({
      message: "Where should the vault live?",
      choices: [
        { name: `${defaultPath} (default)`, value: defaultPath },
        { name: "Custom path", value: "__custom__" },
      ],
    });
    path = location === "__custom__"
      ? await input({ message: "Enter the path:" })
      : location;
  } else {
    const teamMode = await select({
      message: "Is this a solo or team KB?",
      choices: [
        { name: "Solo — you maintain it, full automation", value: "solo" as const },
        { name: "Team — multiple contributors, manual ingestion", value: "team" as const },
      ],
    });
    mode = teamMode === "solo" ? "project-solo" : "project-team";
    path = `${process.cwd()}/.kb`;
  }

  const features = await checkbox({
    message: "What features do you want?",
    choices: [
      { name: "Slide generation (Marp)", value: "slides" },
      { name: "Report outputs", value: "reports" },
      { name: "Data visualizations", value: "visualizations" },
      { name: "Web clipper pipeline", value: "web-clipper" },
    ],
  });

  const domain = await input({
    message: "What domain is this KB about? (optional, press Enter to skip)",
  });

  let schedule: WikillmConfig["schedule"];
  if (mode === "personal" || mode === "project-solo") {
    const wantsSchedule = await confirm({
      message: "Set up scheduled automation?",
      default: true,
    });
    if (wantsSchedule) {
      const ingestFrequency = await select({
        message: "How often should ingestion run?",
        choices: [
          { name: "Hourly", value: "hourly" as const },
          { name: "Daily", value: "daily" as const },
          { name: "Weekdays only", value: "weekdays" as const },
          { name: "Weekly", value: "weekly" as const },
        ],
      });
      const lint = await confirm({
        message: "Set up weekly lint?",
        default: true,
      });
      schedule = { ingestFrequency, lint };
    }
  }

  return {
    name,
    mode,
    path,
    features,
    domain: domain.trim() || undefined,
    schedule,
  };
}
