import { spawnSync } from "node:child_process";

if (!process.env.EXPO_TOKEN) {
  console.error("EXPO_TOKEN is required. Add it as a GitHub Actions secret or define it locally.");
  process.exit(1);
}

function runEas(args, label) {
  console.log("\n" + label);
  const result = spawnSync("npx", ["--yes", "eas-cli@latest", ...args], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32"
  });

  if (result.error) {
    console.error("Unable to start EAS CLI:", result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(label + " failed with exit code " + String(result.status));
    process.exit(result.status ?? 1);
  }
}

runEas(
  ["build", "--platform", "android", "--profile", "production", "--non-interactive", "--wait"],
  "Building the production Android application with EAS"
);

if (process.env.SUBMIT_TO_PLAY_STORE === "true") {
  runEas(
    ["submit", "--platform", "android", "--profile", "production", "--latest", "--non-interactive"],
    "Submitting the latest Android build to the configured Google Play track"
  );
} else {
  console.log("\nBuild completed. Store submission was skipped.");
  console.log("Set SUBMIT_TO_PLAY_STORE=true after configuring Google Play credentials in Expo to submit to the internal testing track.");
}
