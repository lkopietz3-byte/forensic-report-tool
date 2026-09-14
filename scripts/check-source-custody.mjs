import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const tracked = new Set(execFileSync("git", ["ls-files", "--cached", "-z"], {
  cwd: root, encoding: "utf8",
}).split("\0").filter(Boolean));
const missing = [];
const links = [];
function visit(directory) {
  for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) links.push(relative(root, join(root, path)));
    else if (entry.isDirectory()) visit(path);
    else if (entry.isFile() && !tracked.has(path)) missing.push(path);
  }
}
// These contain first-party source, tests, runtime assets and schema inputs.
// Fail on omitted/ignored files rather than trusting a successful local build.
for (const directory of ["src", "scripts", "public", "supabase/migrations"]) visit(directory);
if (missing.length || links.length) {
  console.error(JSON.stringify({ error: "SOURCE_CUSTODY_INCOMPLETE", untracked: missing.sort(), symlinks: links.sort() }, null, 2));
  process.exitCode = 1;
} else {
  console.log("Source custody passed: all local source, tests, scripts, public assets and migrations are in the Git index; no symlinks.");
}
