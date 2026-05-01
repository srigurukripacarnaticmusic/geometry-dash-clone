import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const exts = new Set([".js", ".json", ".html", ".css", ".md", ".ps1"]);

function walk(dir) {
  let files = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files = files.concat(walk(fullPath));
      continue;
    }

    if (exts.has(path.extname(fullPath))) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = walk(rootDir).filter((filePath) => !filePath.includes("node_modules"));
let total = 0;

for (const filePath of files) {
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/).length;
  total += lines;
  console.log(`${path.relative(rootDir, filePath)}: ${lines}`);
}

console.log(`Total lines: ${total}`);
