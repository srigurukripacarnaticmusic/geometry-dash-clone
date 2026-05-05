import { GAME_CONFIG } from "../src/config/gameConfig.js";
import { rectIntersectsSpike } from "../src/physics/Collision.js";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const levelsDir = path.resolve(__dirname, "..", "levels");

const files = readdirSync(levelsDir).filter((file) => file.endsWith(".json"));

if (files.length === 0) {
  console.error("No level files found. Run `node scripts/generate-levels.mjs` first.");
  process.exit(1);
}

let failures = 0;

function getWorldRect(level, object) {
  return {
    x: object.x * level.tileSize,
    y: object.y * level.tileSize,
    width: (object.width ?? 1) * level.tileSize,
    height: (object.height ?? 1) * level.tileSize
  };
}

for (const file of files) {
  const fullPath = path.join(levelsDir, file);
  const raw = readFileSync(fullPath, "utf8");
  const level = JSON.parse(raw);

  const checks = [
    ["id", typeof level.id === "string" && level.id.length > 0],
    ["name", typeof level.name === "string" && level.name.length > 0],
    ["width", Number.isInteger(level.width) && level.width > 10],
    ["height", Number.isInteger(level.height) && level.height > 5],
    ["tileSize", Number.isFinite(level.tileSize) && level.tileSize > 0],
    ["finishX", Number.isFinite(level.finishX) && level.finishX > 0],
    ["songId", typeof level.songId === "string" && level.songId.length > 0],
    ["tiles.solids", Array.isArray(level.tiles?.solids) && level.tiles.solids.length === level.height],
    ["player.spawnX", Number.isFinite(level.player?.spawnX)],
    ["player.spawnY", Number.isFinite(level.player?.spawnY)],
    ["objects", Array.isArray(level.objects)]
  ];

  const invalid = checks.filter(([, passed]) => !passed).map(([name]) => name);

  if (invalid.length > 0) {
    failures += 1;
    console.error(`${file}: invalid fields -> ${invalid.join(", ")}`);
    continue;
  }

  const badRow = level.tiles.solids.find((row) => row.length !== level.width);

  if (badRow) {
    failures += 1;
    console.error(`${file}: one or more tile rows do not match width ${level.width}`);
    continue;
  }

  const playerSpawnRect = {
    x: level.player.spawnX * level.tileSize,
    y: level.player.spawnY * level.tileSize,
    width: GAME_CONFIG.player.width,
    height: GAME_CONFIG.player.height
  };
  const collidingSpawnSpike = level.objects.find((object) => (
    object.type === "spike" &&
    rectIntersectsSpike(playerSpawnRect, {
      ...getWorldRect(level, object),
      direction: object.direction ?? "up"
    })
  ));

  if (collidingSpawnSpike) {
    failures += 1;
    console.error(
      `${file}: player spawn intersects spike at (${collidingSpawnSpike.x}, ${collidingSpawnSpike.y})`
    );
    continue;
  }

  const unsafeOpeningSpikes = level.objects.filter((object) => (
    object.type === "spike" &&
    (object.direction ?? "up") === "up" &&
    object.x < level.player.spawnX + 5 &&
    object.y >= Math.floor(level.player.spawnY) - 1
  ));

  if (unsafeOpeningSpikes.length > 0) {
    failures += 1;
    console.error(
      `${file}: opening floor spikes are too close to spawn -> ${unsafeOpeningSpikes.map((object) => `(${object.x}, ${object.y})`).join(", ")}`
    );
    continue;
  }

  console.log(`${file}: OK (${level.objects.length} objects, ${level.width}x${level.height})`);
}

if (failures > 0) {
  process.exit(1);
}
