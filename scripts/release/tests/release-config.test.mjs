import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(testDirectory, "../../..");

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), "utf8"));
}

function findJsonFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = resolve(directory, entry.name);
    if (entry.isDirectory()) return findJsonFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".json") ? [fullPath] : [];
  });
}

test("the app package exposes the release commands and Expo entry point", () => {
  const packageJson = readJson("package.json");
  assert.equal(packageJson.main, "expo-router/entry");
  assert.ok(packageJson.dependencies?.expo, "Expo dependency must be installed");
  assert.ok(packageJson.dependencies?.["expo-router"], "Expo Router dependency must be installed");
  assert.ok(packageJson.scripts?.lint, "The lint script must exist");
  assert.ok(packageJson.scripts?.["release:prepare"], "The release preparation script must exist");
  assert.ok(packageJson.scripts?.["release:test"], "The release test script must exist");
  assert.ok(packageJson.scripts?.["release:deploy"], "The deployment script must exist");
});

test("the Expo application is linked to an EAS project and Android identifier", () => {
  const expo = readJson("app.json").expo;
  assert.equal(expo.name, "Tinehnemi");
  assert.ok(expo.slug, "An Expo slug is required");
  assert.ok(expo.version, "An application version is required");
  assert.ok(expo.android?.package, "An Android application identifier is required");
  assert.ok(expo.extra?.eas?.projectId, "An EAS project ID is required for CI");
});

test("EAS defines internal preview and production Android build profiles", () => {
  const eas = readJson("eas.json");
  assert.equal(eas.build?.preview?.distribution, "internal");
  assert.ok(eas.build?.production, "A production build profile is required");
  assert.equal(eas.build.production.autoIncrement, true);
  assert.equal(eas.submit?.production?.android?.track, "internal");
});

test("all application content JSON files are valid", () => {
  const files = findJsonFiles(resolve(root, "data"));
  assert.ok(files.length > 0, "The data directory must contain JSON learning content");
  for (const file of files) {
    assert.doesNotThrow(() => JSON.parse(readFileSync(file, "utf8")), "Invalid JSON file: " + relative(root, file));
  }
});

test("all JSON resources statically imported by the content loader exist", () => {
  const loader = readFileSync(resolve(root, "utils/contenido.js"), "utf8");
  const imports = [...loader.matchAll(/from\s+['"]([^'"]+\.json)['"]/g)];
  assert.ok(imports.length > 0, "The content loader must import JSON resources");
  for (const match of imports) {
    const resourcePath = resolve(root, "utils", match[1]);
    assert.ok(existsSync(resourcePath), "Missing content resource: " + match[1]);
  }
});

test("repository ignores environment secrets and generated release metadata", () => {
  const gitignore = readFileSync(resolve(root, ".gitignore"), "utf8");
  assert.match(gitignore, /^\.env\/?$/m);
  assert.match(gitignore, /^\.release\/?$/m);
});
