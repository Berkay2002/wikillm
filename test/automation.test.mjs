import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createAutomationPlan,
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
