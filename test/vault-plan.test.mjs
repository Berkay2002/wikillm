import assert from "node:assert/strict";
import { test } from "node:test";

import { createVaultPlan } from "../dist/init/vault-plan.js";

test("vault plan captures scaffold directories and files without touching disk", () => {
  const plan = createVaultPlan({
    name: "research",
    mode: "project-solo",
    path: ".kb",
    hosts: ["claude", "codex"],
    features: ["slides", "reports"],
    schedule: {
      ingestFrequency: "weekly",
      lint: true,
    },
  }, new Date("2026-06-19T10:20:00.000Z"));

  assert.equal(plan.root, ".kb");
  assert.equal(plan.initializeGit, false);
  assert.ok(plan.directories.includes("raw/assets"));
  assert.ok(plan.directories.includes("wiki/_index"));
  assert.ok(plan.directories.includes("outputs/slides"));
  assert.ok(plan.directories.includes("outputs/reports"));
  assert.ok(plan.directories.includes(".obsidian"));
  assert.ok(plan.directories.includes(".wikillm"));

  assert.ok(plan.files.some((file) => file.path === ".gitignore"));
  assert.ok(plan.files.some((file) => file.path === "wiki/_index/LOG.md" && file.content.includes("2026-06-19 10:20")));
  assert.ok(plan.files.some((file) => file.path === ".wikillm/automation.json" && file.content.includes('"ingestFrequency": "weekly"')));
});

test("personal vault plan initializes git and omits automation metadata when unscheduled", () => {
  const plan = createVaultPlan({
    name: "personal",
    mode: "personal",
    path: "C:/tmp/personal",
    hosts: ["claude"],
    features: [],
  });

  assert.equal(plan.initializeGit, true);
  assert.equal(plan.files.some((file) => file.path === ".wikillm/automation.json"), false);
});
