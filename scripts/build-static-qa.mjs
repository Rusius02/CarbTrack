import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(projectRoot, "dist");
const sourceDirectory = path.join(projectRoot, "src");

await mkdir(outputDirectory, { recursive: true });
await cp(path.join(projectRoot, "index.html"), path.join(outputDirectory, "index.html"));
await cp(path.join(projectRoot, "styles.css"), path.join(outputDirectory, "styles.css"));
await cp(sourceDirectory, path.join(outputDirectory, "src"), { recursive: true });

const htmlPath = path.join(outputDirectory, "index.html");
const html = await readFile(htmlPath, "utf8");
const entrypoint = '<script type="module" src="./src/main.js"></script>';
if (!html.includes(entrypoint)) {
  throw new Error("Point d’entrée CarbTrack introuvable dans index.html.");
}
await writeFile(
  htmlPath,
  html.replace(
    entrypoint,
    `<script>window.CARBTRACK_STORAGE_MODE = "browser";</script>\n    ${entrypoint}`
  ),
  "utf8"
);
console.log(`Build QA statique créé dans ${outputDirectory}`);
