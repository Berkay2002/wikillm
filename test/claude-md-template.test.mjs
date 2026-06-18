import assert from "node:assert/strict";
import { test } from "node:test";

import { renderAgentsMd, renderClaudeMd } from "../dist/init/claude-md-template.js";

test("generated schema leads with query-critical operating rules", () => {
  const rendered = renderClaudeMd({
    name: "enterprise-ai",
    mode: "project-team",
    path: ".kb",
    hosts: ["claude"],
    features: ["reports"],
    domain: "enterprise AI systems",
  });

  assert.match(rendered, /^# enterprise-ai\n\n\*\*Query-critical summary:\*\*/);
  assert.ok(
    rendered.indexOf("**Query-critical summary:**") < rendered.indexOf("## Philosophy"),
    "query-critical summary should appear before the long-form philosophy"
  );
  assert.match(rendered, /Compiled knowledge lives in `wiki\/`/);
  assert.match(rendered, /Never answer from `raw\/` unless you are diagnosing ingest drift/);
  assert.match(rendered, /Team mode is manual only/);
  assert.match(rendered, /Domain scope: enterprise AI systems/);
});

test("generated Codex schema uses AGENTS.md command conventions", () => {
  const rendered = renderAgentsMd({
    name: "enterprise-ai",
    mode: "project-solo",
    path: ".kb",
    hosts: ["codex"],
    features: ["reports"],
    domain: "enterprise AI systems",
    schedule: {
      ingestFrequency: "daily",
      lint: true,
    },
  });

  assert.match(rendered, /^# enterprise-ai\n\n\*\*Query-critical summary:\*\*/);
  assert.match(rendered, /\$wikillm:ingest/);
  assert.match(rendered, /\$wikillm:query/);
  assert.match(rendered, /Automation guidance is recorded in `\.wikillm\/automation\.json`/);
  assert.match(rendered, /does not install host automations/);
  assert.match(rendered, /├── \.wikillm\/\s+← wikillm metadata/);
  assert.match(rendered, /AGENTS\.md\s+← this file/);
  assert.match(rendered, /Codex plugins do not automatically register `agents\/ingest-worker\.md` as a custom agent/);
});
