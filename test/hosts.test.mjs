import assert from "node:assert/strict";
import { test } from "node:test";

import {
  automationRuntimesFor,
  commandFor,
  commandsForHosts,
  normalizeHosts,
  rootInstructionFilesFor,
  schemaFileNameFor,
} from "../dist/init/hosts.js";

test("host profiles centralize command and schema conventions", () => {
  assert.deepEqual(normalizeHosts([]), ["claude"]);
  assert.deepEqual(normalizeHosts(["codex", "claude", "codex"]), ["codex", "claude"]);

  assert.equal(commandFor("claude", "ingest"), "/wikillm:ingest");
  assert.equal(commandFor("codex", "query"), "$wikillm:query");
  assert.equal(schemaFileNameFor("claude"), "CLAUDE.md");
  assert.equal(schemaFileNameFor("codex"), "AGENTS.md");
});

test("host profile helpers render multi-host user instructions", () => {
  const hosts = ["claude", "codex"];

  assert.deepEqual(commandsForHosts(hosts, "lint"), ["/wikillm:lint", "$wikillm:lint"]);
  assert.equal(rootInstructionFilesFor(hosts), "CLAUDE.md and AGENTS.md");
  assert.equal(automationRuntimesFor(hosts), "Claude Desktop and the Codex app");
});
