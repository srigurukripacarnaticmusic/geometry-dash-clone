import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const levelsDir = path.join(rootDir, "levels");
const levelDataModulePath = path.join(rootDir, "src", "level", "levelData.js");

mkdirSync(levelsDir, { recursive: true });

function createRows(width, height, fill = ".") {
  return Array.from({ length: height }, () => fill.repeat(width).split(""));
}

function setRange(rows, y, startX, endX, value = "#") {
  for (let x = startX; x <= endX; x += 1) {
    rows[y][x] = value;
  }
}

function carve(rows, y, startX, endX) {
  setRange(rows, y, startX, endX, ".");
}

function finalizeRows(rows) {
  return rows.map((row) => row.join(""));
}

function spikeRow(objects, startX, count, y, direction = "up", gap = 2, color = "#ff6e96") {
  for (let index = 0; index < count; index += 1) {
    objects.push({
      type: "spike",
      x: startX + index * gap,
      y,
      width: 1,
      height: 1,
      direction,
      color
    });
  }
}

function ceilingSpikeRun(objects, startX, count, y = 1, gap = 2) {
  spikeRow(objects, startX, count, y, "down", gap, "#ff9fd4");
}

function makeLevelOne() {
  const width = 176;
  const height = 15;
  const rows = createRows(width, height);

  setRange(rows, 0, 0, width - 1, "#");
  setRange(rows, 13, 0, width - 1, "#");
  setRange(rows, 14, 0, width - 1, "#");
  setRange(rows, 8, 42, 64, "#");
  setRange(rows, 8, 112, 132, "#");
  setRange(rows, 7, 148, 164, "#");
  setRange(rows, 10, 84, 91, "#");
  setRange(rows, 10, 100, 107, "#");
  carve(rows, 13, 80, 84);
  carve(rows, 14, 80, 84);
  carve(rows, 13, 118, 121);
  carve(rows, 14, 118, 121);

  const objects = [];
  spikeRow(objects, 10, 3, 12);
  spikeRow(objects, 18, 2, 12, "up", 3);
  objects.push({ type: "jumpPad", x: 24, y: 12.75, width: 1, height: 0.25, power: 1.28, color: "#ffe57a" });
  spikeRow(objects, 28, 3, 12);
  objects.push({ type: "portal", portalType: "gravity", x: 38, y: 9, width: 1, height: 3, targetGravity: -1 });
  ceilingSpikeRun(objects, 44, 7, 1, 2);
  objects.push({ type: "block", x: 54, y: 4, width: 2, height: 1, color: "#395b84" });
  objects.push({ type: "portal", portalType: "gravity", x: 62, y: 6, width: 1, height: 3, targetGravity: 1 });
  spikeRow(objects, 69, 2, 12, "up", 3);
  objects.push({ type: "portal", portalType: "speed", x: 74, y: 9, width: 1, height: 3, speedMultiplier: 1.32 });
  objects.push({ type: "movingPlatform", x: 80, y: 12, width: 2, height: 0.5, axis: "y", distance: 2, speed: 66, color: "#9fe0ff" });
  objects.push({ type: "checkpoint", x: 93, y: 10.5, width: 0.4, height: 2, color: "#ffe57a" });
  spikeRow(objects, 99, 4, 12, "up", 2);
  objects.push({ type: "jumpPad", x: 108, y: 12.75, width: 1, height: 0.25, power: 1.24, color: "#ffe57a" });
  objects.push({ type: "spike", x: 114, y: 12, width: 1, height: 1, direction: "up", color: "#ff6e96" });
  objects.push({ type: "portal", portalType: "gravity", x: 120, y: 9, width: 1, height: 3, targetGravity: -1 });
  ceilingSpikeRun(objects, 124, 5, 1, 3);
  objects.push({ type: "portal", portalType: "gravity", x: 136, y: 6, width: 1, height: 3, targetGravity: 1 });
  objects.push({ type: "movingPlatform", x: 144, y: 10.5, width: 2, height: 0.5, axis: "x", distance: 3, speed: 54, color: "#89ffb0" });
  spikeRow(objects, 151, 3, 12, "up", 2);
  objects.push({ type: "jumpPad", x: 158, y: 12.75, width: 1, height: 0.25, power: 1.32, color: "#ffe57a" });
  spikeRow(objects, 164, 2, 12, "up", 2);

  return {
    id: "level-01",
    name: "Neon Run",
    description: "Intro course with steady rhythm, bounce timing, gravity flips, and moving-platform recovery sections.",
    width,
    height,
    tileSize: 48,
    baseSpeed: 240,
    finishX: 171,
    songId: "neonPulse",
    meta: {
      author: "Codex",
      difficulty: "Normal"
    },
    player: {
      spawnX: 4,
      spawnY: 12.25
    },
    colors: {
      skyTop: "#102744",
      skyBottom: "#05101d",
      glow: "#7bf7ff",
      accent: "#ffe57a",
      tile: "#23496d"
    },
    tiles: {
      solids: finalizeRows(rows)
    },
    objects
  };
}

function makeLevelTwo() {
  const width = 224;
  const height = 15;
  const rows = createRows(width, height);

  setRange(rows, 0, 0, width - 1, "#");
  setRange(rows, 13, 0, width - 1, "#");
  setRange(rows, 14, 0, width - 1, "#");
  setRange(rows, 7, 34, 62, "#");
  setRange(rows, 8, 88, 113, "#");
  setRange(rows, 9, 138, 160, "#");
  setRange(rows, 8, 176, 196, "#");
  carve(rows, 13, 48, 52);
  carve(rows, 14, 48, 52);
  carve(rows, 13, 116, 120);
  carve(rows, 14, 116, 120);
  carve(rows, 13, 186, 190);
  carve(rows, 14, 186, 190);

  const objects = [];
  spikeRow(objects, 9, 4, 12, "up", 2);
  objects.push({ type: "jumpPad", x: 18, y: 12.75, width: 1, height: 0.25, power: 1.3, color: "#ffe57a" });
  spikeRow(objects, 23, 3, 12, "up", 2);
  objects.push({ type: "portal", portalType: "gravity", x: 31, y: 9, width: 1, height: 3, targetGravity: -1 });
  ceilingSpikeRun(objects, 36, 6, 1, 2);
  objects.push({ type: "portal", portalType: "speed", x: 45, y: 6, width: 1, height: 3, speedMultiplier: 1.45 });
  objects.push({ type: "movingPlatform", x: 48, y: 12, width: 2, height: 0.5, axis: "y", distance: 2, speed: 72, color: "#7bf7ff" });
  objects.push({ type: "portal", portalType: "gravity", x: 58, y: 6, width: 1, height: 3, targetGravity: 1 });
  spikeRow(objects, 66, 4, 12, "up", 2);
  objects.push({ type: "checkpoint", x: 78, y: 10.5, width: 0.4, height: 2, color: "#ffe57a" });
  objects.push({ type: "jumpPad", x: 84, y: 12.75, width: 1, height: 0.25, power: 1.2, color: "#ffe57a" });
  spikeRow(objects, 92, 3, 7, "down", 2, "#ff9fd4");
  objects.push({ type: "portal", portalType: "gravity", x: 104, y: 9, width: 1, height: 3, targetGravity: -1 });
  ceilingSpikeRun(objects, 110, 4, 1, 3);
  objects.push({ type: "portal", portalType: "gravity", x: 118, y: 6, width: 1, height: 3, targetGravity: 1 });
  objects.push({ type: "movingPlatform", x: 116, y: 12, width: 2, height: 0.5, axis: "x", distance: 3, speed: 58, color: "#89ffb0" });
  spikeRow(objects, 126, 5, 12, "up", 2);
  objects.push({ type: "portal", portalType: "speed", x: 138, y: 9, width: 1, height: 3, speedMultiplier: 1.55 });
  objects.push({ type: "block", x: 146, y: 10, width: 2, height: 1, color: "#355374" });
  objects.push({ type: "block", x: 149, y: 9, width: 2, height: 1, color: "#355374" });
  objects.push({ type: "jumpPad", x: 153, y: 12.75, width: 1, height: 0.25, power: 1.34, color: "#ffe57a" });
  objects.push({ type: "portal", portalType: "gravity", x: 166, y: 9, width: 1, height: 3, targetGravity: -1 });
  ceilingSpikeRun(objects, 172, 5, 1, 2);
  objects.push({ type: "movingPlatform", x: 186, y: 12, width: 2, height: 0.5, axis: "y", distance: 2, speed: 74, color: "#9fe0ff" });
  objects.push({ type: "portal", portalType: "gravity", x: 194, y: 6, width: 1, height: 3, targetGravity: 1 });
  spikeRow(objects, 201, 5, 12, "up", 2);
  objects.push({ type: "jumpPad", x: 213, y: 12.75, width: 1, height: 0.25, power: 1.35, color: "#ffe57a" });

  return {
    id: "level-02",
    name: "Gravity Groove",
    description: "Faster sections with back-to-back gravity routing, moving platforms, and denser spike timing.",
    width,
    height,
    tileSize: 48,
    baseSpeed: 240,
    finishX: 219,
    songId: "gravityDrive",
    meta: {
      author: "Codex",
      difficulty: "Hard"
    },
    player: {
      spawnX: 4,
      spawnY: 12.25
    },
    colors: {
      skyTop: "#24133f",
      skyBottom: "#07101d",
      glow: "#89ffb0",
      accent: "#7bf7ff",
      tile: "#3d3d7d"
    },
    tiles: {
      solids: finalizeRows(rows)
    },
    objects
  };
}

function writeLevel(fileName, data) {
  writeFileSync(path.join(levelsDir, fileName), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const levelOne = makeLevelOne();
const levelTwo = makeLevelTwo();

writeLevel("level-01.json", levelOne);
writeLevel("level-02.json", levelTwo);

writeFileSync(
  levelDataModulePath,
  `export const LEVEL_DATA = ${JSON.stringify({
    "level-01": levelOne,
    "level-02": levelTwo
  }, null, 2)};\n`,
  "utf8"
);

console.log("Level JSON generated in", levelsDir);
