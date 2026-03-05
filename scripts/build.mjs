import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");
const publicDir = join(rootDir, "public");

await rm(distDir, { force: true, recursive: true });
await mkdir(distDir, { recursive: true });
await cp(publicDir, distDir, { recursive: true });

await esbuild.build({
  bundle: true,
  entryPoints: {
    background: join(rootDir, "src/background.ts"),
    content: join(rootDir, "src/content/index.tsx"),
    popup: join(rootDir, "src/popup/index.tsx"),
  },
  format: "esm",
  jsx: "automatic",
  legalComments: "none",
  outdir: distDir,
  platform: "browser",
  sourcemap: false,
  target: ["chrome114"],
});
