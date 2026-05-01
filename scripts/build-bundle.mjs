import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const entryFile = path.join(rootDir, "src", "main.js");
const distDir = path.join(rootDir, "dist");
const outputFile = path.join(distDir, "game.bundle.js");

const moduleCache = new Map();

function normalizeModuleId(filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, "/");
}

function resolveImport(fromFilePath, specifier) {
  if (!specifier.startsWith(".")) {
    throw new Error(`Only relative imports are supported in the bundle builder. Found "${specifier}" in ${fromFilePath}`);
  }

  const resolved = new URL(specifier, pathToFileURL(fromFilePath));
  return fileURLToPath(resolved);
}

function collectImportedNames(importClause) {
  const trimmed = importClause.trim();

  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    throw new Error(`Unsupported import syntax in bundle build: ${importClause}`);
  }

  return trimmed
    .slice(1, -1)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.includes(" as ")) {
        const [imported, local] = part.split(/\s+as\s+/);
        return `${imported.trim()}: ${local.trim()}`;
      }

      return part;
    })
    .join(", ");
}

function transformModule(filePath) {
  if (moduleCache.has(filePath)) {
    return;
  }

  const original = readFileSync(filePath, "utf8");
  const dependencies = [];
  let source = original;

  source = source.replace(
    /^import\s+([^;]+?)\s+from\s+["'](.+?)["'];?\s*$/gm,
    (_, importClause, specifier) => {
      const resolvedPath = resolveImport(filePath, specifier);
      dependencies.push(resolvedPath);
      const moduleId = normalizeModuleId(resolvedPath);
      return `const { ${collectImportedNames(importClause)} } = __require__(${JSON.stringify(moduleId)});`;
    }
  );

  source = source.replace(/^import\s+["'](.+?)["'];?\s*$/gm, (_, specifier) => {
    const resolvedPath = resolveImport(filePath, specifier);
    dependencies.push(resolvedPath);
    const moduleId = normalizeModuleId(resolvedPath);
    return `__require__(${JSON.stringify(moduleId)});`;
  });

  const exports = [];

  source = source.replace(/^export\s+class\s+([A-Za-z0-9_]+)/gm, (_, name) => {
    exports.push(name);
    return `class ${name}`;
  });

  source = source.replace(/^export\s+function\s+([A-Za-z0-9_]+)/gm, (_, name) => {
    exports.push(name);
    return `function ${name}`;
  });

  source = source.replace(/^export\s+(const|let|var)\s+([A-Za-z0-9_]+)/gm, (_, keyword, name) => {
    exports.push(name);
    return `${keyword} ${name}`;
  });

  source = source.replace(/^export\s*\{\s*([^}]+)\s*\};?\s*$/gm, (_, names) => {
    const assignments = names
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        if (part.includes(" as ")) {
          const [local, exported] = part.split(/\s+as\s+/);
          return `exports.${exported.trim()} = ${local.trim()};`;
        }

        return `exports.${part} = ${part};`;
      })
      .join("\n");

    return assignments;
  });

  const footer = exports.map((name) => `exports.${name} = ${name};`).join("\n");
  moduleCache.set(filePath, {
    id: normalizeModuleId(filePath),
    source: `${source}\n${footer}\n`,
    dependencies
  });

  for (const dependency of dependencies) {
    transformModule(dependency);
  }
}

transformModule(entryFile);

const orderedModules = [...moduleCache.values()].sort((first, second) => first.id.localeCompare(second.id));

const bundle = `(() => {
  const __modules__ = {
${orderedModules.map((module) => `    ${JSON.stringify(module.id)}: (exports, __require__) => {\n${module.source.split("\n").map((line) => `      ${line}`).join("\n")}\n    }`).join(",\n")}
  };

  const __cache__ = {};

  function __require__(id) {
    if (__cache__[id]) {
      return __cache__[id].exports;
    }

    const module = { exports: {} };
    __cache__[id] = module;
    const factory = __modules__[id];

    if (!factory) {
      throw new Error(\`Missing bundled module: \${id}\`);
    }

    factory(module.exports, __require__);
    return module.exports;
  }

  __require__(${JSON.stringify(normalizeModuleId(entryFile))});
})();\n`;

mkdirSync(distDir, { recursive: true });
writeFileSync(outputFile, bundle, "utf8");
console.log(`Bundled ${orderedModules.length} modules into ${outputFile}`);
