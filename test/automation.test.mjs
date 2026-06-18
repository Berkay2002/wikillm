import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createAutomationPlan,
  renderClaudeScheduledTaskPrompt,
  renderCodexAutomationPrompt,
  renderAutomationNextSteps,
  renderAutomationSection,
} from "../dist/init/automation.js";

test("automation plan is explicit guidance when schedules are requested", () => {
  const config = {
    name: "research",
    mode: "project-solo",
    path: ".kb",
    hosts: ["codex"],
    features: [],
    schedule: {
      ingestFrequency: "daily",
      lint: true,
    },
  };

  const plan = createAutomationPlan(config);

  assert.equal(plan.kind, "guided");
  assert.equal(plan.ingestFrequency, "daily");
  assert.deepEqual(plan.commands, ["$wikillm:ingest", "$wikillm:lint"]);
  assert.match(renderAutomationSection(config, "codex"), /Automation guidance/);
  assert.doesNotMatch(renderAutomationSection(config, "codex"), /Scheduled tasks run via/);
  assert.match(renderAutomationNextSteps(config).join("\n"), /Automation guidance written/);
});

test("codex automation guidance includes a durable standalone automation prompt", () => {
  const config = {
    name: "research",
    mode: "project-solo",
    path: ".kb",
    hosts: ["codex"],
    features: [],
    schedule: {
      ingestFrequency: "daily",
      lint: true,
    },
  };

  const prompt = renderCodexAutomationPrompt(config);

  assert.match(prompt, /Create a standalone project automation/);
  assert.match(prompt, /Schedule: daily/);
  assert.match(prompt, /Use local project mode if new raw files are usually uncommitted/);
  assert.match(prompt, /Use a dedicated background worktree if raw sources are committed before each run/);
  assert.match(prompt, /\$wikillm:ingest/);
  assert.match(prompt, /\$wikillm:lint/);
  assert.match(prompt, /If there are 3\+ new sources/);
  assert.match(prompt, /approval_policy = "never"/);
  assert.match(prompt, /Test this prompt manually/);
});

test("claude automation guidance includes a durable local scheduled task prompt", () => {
  const config = {
    name: "research",
    mode: "personal",
    path: "C:/kb/research",
    hosts: ["claude"],
    features: [],
    schedule: {
      ingestFrequency: "weekdays",
      lint: true,
    },
  };

  const prompt = renderClaudeScheduledTaskPrompt(config);

  assert.match(prompt, /Create a local scheduled task in Claude Code Desktop/);
  assert.match(prompt, /Schedule: weekdays/);
  assert.match(prompt, /Working folder: C:\/kb\/research/);
  assert.match(prompt, /Use the current working directory if new raw files are usually uncommitted/);
  assert.match(prompt, /Enable the worktree toggle if raw sources are committed before each run/);
  assert.match(prompt, /Run now after creating the task/);
  assert.match(prompt, /Keep computer awake/);
});

test("team mode stays manual even if a schedule is present", () => {
  const config = {
    name: "team-kb",
    mode: "project-team",
    path: ".kb",
    hosts: ["claude"],
    features: [],
    schedule: {
      ingestFrequency: "hourly",
      lint: true,
    },
  };

  const plan = createAutomationPlan(config);

  assert.equal(plan.kind, "manual");
  assert.equal(plan.commands.length, 0);
  assert.match(renderAutomationSection(config, "claude"), /Manual only/);
});
