// Reads the local package version and checks if it's already published on npm.
// Sets the `published` output to "true" or "false".
//
// Usage: node .github/scripts/check-published-version.mjs

import { readFileSync, appendFileSync } from "node:fs";
import { execSync } from "node:child_process";

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const { name, version } = pkg;

try {
  const published = execSync(`npm view ${name} version`, {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "ignore"],
  }).trim();

  const alreadyPublished = published === version;

  // GitHub Actions sets outputs from stdout in the format ::set-output or
  // $GITHUB_OUTPUT. We use $GITHUB_OUTPUT for reliability.
  const output = process.env.GITHUB_OUTPUT;
  if (output) {
    appendFileSync(output, `published=${alreadyPublished}\n`);
  } else {
    console.log(`published=${alreadyPublished}`);
  }
} catch {
  // Package not found on registry at all — definitely not published
  const output = process.env.GITHUB_OUTPUT;
  if (output) {
    appendFileSync(output, "published=false\n");
  } else {
    console.log("published=false");
  }
}
