#!/usr/bin/env node
/**
 * Deploy Firestore rules + indexes using FIREBASE_PROJECT_ID from .env.local.
 */
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");

function loadProjectId() {
  if (!existsSync(envPath)) {
    console.error(
      "Missing .env.local — copy .env.example and set FIREBASE_PROJECT_ID.",
    );
    process.exit(1);
  }
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== "FIREBASE_PROJECT_ID") continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) return value;
  }
  console.error("FIREBASE_PROJECT_ID is not set in .env.local");
  process.exit(1);
}

const projectId = loadProjectId();
console.log(`Deploying Firestore rules + indexes to project: ${projectId}\n`);

const child = spawn(
  "firebase",
  [
    "deploy",
    "--only",
    "firestore:rules,firestore:indexes",
    "--project",
    projectId,
  ],
  { cwd: root, stdio: "inherit", shell: true },
);

child.on("exit", (code) => process.exit(code ?? 1));
