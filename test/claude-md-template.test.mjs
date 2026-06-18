import assert from "node:assert/strict";
import { test } from "node:test";

import { renderClaudeMd } from "../dist/init/claude-md-template.js";

test("generated schema leads with query-critical operating rules", () => {
  const rendered = renderClaudeMd({
    name: "enterprise-ai",
    mode: "project-team",
    path: ".kb",
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
