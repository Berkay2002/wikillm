import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { inspectVault } from "../dist/commands/vault-inspector.js";

test("vault inspector fully inspects a project .kb from the project root", async () => {
  const root = await mkdtemp(join(tmpdir(), "wikillm-inspector-"));
  const vault = join(root, ".kb");

  await mkdir(join(vault, "raw", "assets"), { recursive: true });
  await mkdir(join(vault, "wiki", "_index"), { recursive: true });
  await writeFile(join(vault, "AGENTS.md"), "# Codex vault\n");
  await writeFile(join(vault, "wiki", "_index", "INDEX.md"), "# Index\n");

  const result = await inspectVault(root);

  assert.equal(result.location.kind, "project");
  assert.equal(result.location.root, vault);
  assert.deepEqual(result.hosts, ["codex"]);
  assert.ok(result.diagnostics.some((item) => item.id === "vault.detected" && item.severity === "ok"));
  assert.ok(result.diagnostics.some((item) => item.id === "index.missing" && item.path.endsWith("TAGS.md")));
  assert.equal(result.diagnostics.some((item) => item.id === "schema.missing" && item.path.endsWith("CLAUDE.md")), false);
});

test("vault inspector reports missing vaults without throwing", async () => {
  const root = await mkdtemp(join(tmpdir(), "wikillm-no-vault-"));

  const result = await inspectVault(root);

  assert.equal(result.location.kind, "none");
  assert.deepEqual(result.hosts, []);
  assert.ok(result.diagnostics.some((item) => item.id === "vault.missing" && item.severity === "warn"));
});
