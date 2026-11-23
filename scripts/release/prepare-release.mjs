import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const requiredFiles = ["package.json", "package-lock.json", "app.json", "eas.json"];

for (const relativePath of requiredFiles) {
  if (!existsSync(resolve(root, relativePath))) {
    throw new Error("Required release file is missing: " + relativePath);
  }
}

const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const appConfig = JSON.parse(await readFile(resolve(root, "app.json"), "utf8"));
const easConfig = JSON.parse(await readFile(resolve(root, "eas.json"), "utf8"));

const expo = appConfig.expo ?? {};
const androidPackage = expo.android?.package;
const projectId = expo.extra?.eas?.projectId;
const productionProfile = easConfig.build?.production;

if (!projectId) throw new Error("app.json must define expo.extra.eas.projectId.");
if (!androidPackage) throw new Error("app.json must define expo.android.package.");
if (!productionProfile) throw new Error("eas.json must define build.production.");
if (!packageJson.version || !expo.version) throw new Error("Package and Expo versions must be defined.");

const metadata = {
  application: expo.name ?? packageJson.name,
  slug: expo.slug ?? null,
  version: expo.version,
  packageVersion: packageJson.version,
  androidPackage,
  expoProjectId: projectId,
  buildProfile: "production",
  commit: process.env.GITHUB_SHA ?? "local",
  generatedAt: new Date().toISOString()
};

const outputDirectory = resolve(root, ".release");
await mkdir(outputDirectory, { recursive: true });
await writeFile(resolve(outputDirectory, "release-metadata.json"), JSON.stringify(metadata, null, 2) + "\n", "utf8");

console.log("Release environment prepared.");
console.log("Application: " + metadata.application);
console.log("Version: " + metadata.version);
console.log("Android package: " + metadata.androidPackage);
console.log("Metadata: .release/release-metadata.json");
