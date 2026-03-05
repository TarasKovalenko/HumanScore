import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdir, readFile, rename, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");
const releaseDir = join(rootDir, "releases");

const mode = process.argv[2] ?? "all";
if (!["zip", "crx", "all"].includes(mode)) {
  console.error("Usage: node ./scripts/package.mjs [zip|crx|all]");
  process.exit(1);
}

try {
  const packageJson = JSON.parse(await readFile(join(rootDir, "package.json"), "utf8"));
  const normalizedName = String(packageJson.name ?? "extension")
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const version = String(packageJson.version ?? "0.0.0");
  const artifactBase = `${normalizedName}-v${version}`;

  await ensureBuild();
  await mkdir(releaseDir, { recursive: true });

  if (mode === "zip" || mode === "all") {
    await packageZip(artifactBase);
  }

  if (mode === "crx" || mode === "all") {
    await packageCrx(artifactBase);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

async function ensureBuild() {
  console.log("Building extension...");
  await runCommand(process.execPath, [join(rootDir, "scripts/build.mjs")], { cwd: rootDir });
}

async function packageZip(artifactBase) {
  const zipOutput = join(releaseDir, `${artifactBase}.zip`);
  await rm(zipOutput, { force: true });

  console.log(`Creating ZIP: ${zipOutput}`);
  await runCommand("zip", ["-r", "-X", zipOutput, "."], { cwd: distDir });
}

async function packageCrx(artifactBase) {
  const chromeBin = await resolveChromeBinary();
  if (!chromeBin) {
    throw new Error(
      "Could not find Chrome/Chromium binary. Set CHROME_BIN to your browser executable path."
    );
  }

  const tempCrx = join(rootDir, "dist.crx");
  const tempPem = join(rootDir, "dist.pem");
  const crxOutput = join(releaseDir, `${artifactBase}.crx`);
  const keyFromEnv = process.env.CRX_KEY_PATH ? resolve(rootDir, process.env.CRX_KEY_PATH) : null;

  await rm(tempCrx, { force: true });
  if (!keyFromEnv) {
    await rm(tempPem, { force: true });
  }
  await rm(crxOutput, { force: true });

  const args = [`--pack-extension=${distDir}`];
  if (keyFromEnv) {
    args.push(`--pack-extension-key=${keyFromEnv}`);
  }

  console.log(`Creating CRX with: ${chromeBin}`);
  await runCommand(chromeBin, args, { cwd: rootDir });

  if (!(await exists(tempCrx))) {
    throw new Error("Chrome did not produce dist.crx. Packaging failed.");
  }
  await rename(tempCrx, crxOutput);
  console.log(`Created CRX: ${crxOutput}`);

  if (!keyFromEnv && (await exists(tempPem))) {
    const generatedKeyOutput = join(releaseDir, `${artifactBase}.pem`);
    await rm(generatedKeyOutput, { force: true });
    await rename(tempPem, generatedKeyOutput);
    console.log(`Generated key: ${generatedKeyOutput}`);
  }
}

async function resolveChromeBinary() {
  const candidates = [
    process.env.CHROME_BIN,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return candidate;
    }
  }

  return null;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? rootDir,
      stdio: "inherit",
    });

    child.on("error", (error) => {
      rejectPromise(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        rejectPromise(new Error(`Command failed (${code}): ${command} ${args.join(" ")}`));
      }
    });
  });
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
