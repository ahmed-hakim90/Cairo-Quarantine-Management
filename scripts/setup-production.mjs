#!/usr/bin/env node
/**
 * Runs Firestore seeds in order. Requires .env.local with Admin SDK credentials.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const steps = [
  ["seed:offices", "Offices"],
  ["seed:vaccines", "Vaccines"],
  ["seed:traveler-states", "Traveler states"],
];

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", script], {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code}`));
    });
  });
}

async function main() {
  console.log("Cairo QMS — production data setup\n");
  for (const [script, label] of steps) {
    console.log(`→ ${label} (${script})`);
    await run(script);
  }
  console.log("\nDone. Next: npm run admin:create-profile -- <uid> email@example.com \"Name\"");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
