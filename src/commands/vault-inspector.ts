import { access, stat } from "fs/promises";
import { join, resolve } from "path";
import type { AgentHost } from "../init/hosts.js";
import { hostProfiles } from "../init/hosts.js";

export type DiagnosticSeverity = "ok" | "warn" | "error";
export type VaultLocationKind = "vault" | "project" | "none";

export interface VaultLocation {
  kind: VaultLocationKind;
  root: string;
}

export interface VaultDiagnostic {
  id: string;
  severity: DiagnosticSeverity;
  message: string;
  path?: string;
}

export interface VaultInspection {
  location: VaultLocation;
  hosts: AgentHost[];
  features: string[];
  diagnostics: VaultDiagnostic[];
}

const indexFiles = ["INDEX.md", "TAGS.md", "SOURCES.md", "RECENT.md", "LOG.md"];

export async function inspectVault(cwd = process.cwd()): Promise<VaultInspection> {
  const cwdAbs = resolve(cwd);
  const currentIsVault = await looksLikeVault(cwdAbs);
  const projectVault = join(cwdAbs, ".kb");

  if (currentIsVault) {
    return inspectVaultRoot({ kind: "vault", root: cwdAbs });
  }

  if (await looksLikeVault(projectVault)) {
    return inspectVaultRoot({ kind: "project", root: projectVault });
  }

  return {
    location: { kind: "none", root: cwdAbs },
    hosts: [],
    features: [],
    diagnostics: [
      {
        id: "vault.missing",
        severity: "warn",
        message: "No wikillm vault detected in the current directory or .kb/.",
        path: cwdAbs,
      },
    ],
  };
}

async function inspectVaultRoot(location: VaultLocation): Promise<VaultInspection> {
  const diagnostics: VaultDiagnostic[] = [
    {
      id: "vault.detected",
      severity: "ok",
      message: location.kind === "project"
        ? "Valid project KB detected (.kb/)."
        : "Valid KB vault detected in current directory.",
      path: location.root,
    },
  ];

  const hosts = await inferHosts(location.root);
  if (hosts.length === 0) {
    diagnostics.push({
      id: "schema.missing",
      severity: "error",
      message: "No host schema found. Expected CLAUDE.md, AGENTS.md, or both.",
      path: location.root,
    });
  }

  await checkDirectory(location.root, "raw", diagnostics);
  await checkDirectory(location.root, "wiki", diagnostics);
  await checkDirectory(location.root, "wiki/_index", diagnostics);

  for (const fileName of indexFiles) {
    const path = join(location.root, "wiki", "_index", fileName);
    if (await pathExists(path)) {
      diagnostics.push({
        id: "index.exists",
        severity: "ok",
        message: `wiki/_index/${fileName} exists.`,
        path,
      });
    } else {
      diagnostics.push({
        id: "index.missing",
        severity: "error",
        message: `wiki/_index/${fileName} missing.`,
        path,
      });
    }
  }

  const features = await inferFeatures(location.root);
  return { location, hosts, features, diagnostics };
}

async function inferHosts(root: string): Promise<AgentHost[]> {
  const hosts = Object.values(hostProfiles).map((profile) => profile.id);
  const present: AgentHost[] = [];

  for (const host of hosts) {
    if (await pathExists(join(root, hostProfiles[host].schemaFileName))) {
      present.push(host);
    }
  }

  return present;
}

async function inferFeatures(root: string): Promise<string[]> {
  const features: string[] = [];
  if (await pathExists(join(root, "outputs", "slides"))) features.push("slides");
  if (await pathExists(join(root, "outputs", "reports"))) features.push("reports");
  if (await pathExists(join(root, "outputs", "visualizations"))) features.push("visualizations");
  return features;
}

async function checkDirectory(root: string, relativePath: string, diagnostics: VaultDiagnostic[]): Promise<void> {
  const path = join(root, ...relativePath.split("/"));
  if (await isDirectory(path)) {
    diagnostics.push({
      id: "directory.exists",
      severity: "ok",
      message: `${relativePath}/ exists.`,
      path,
    });
  } else {
    diagnostics.push({
      id: "directory.missing",
      severity: "error",
      message: `${relativePath}/ missing.`,
      path,
    });
  }
}

async function looksLikeVault(path: string): Promise<boolean> {
  const schemaPresent = Object.values(hostProfiles)
    .map((profile) => pathExists(join(path, profile.schemaFileName)));
  const schemaResults = await Promise.all(schemaPresent);
  if (schemaResults.some(Boolean)) return true;

  return (await pathExists(join(path, "raw"))) && (await pathExists(join(path, "wiki")));
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
