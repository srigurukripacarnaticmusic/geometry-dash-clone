import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const levelsDir = path.join(rootDir, "levels");
const levelDataModulePath = path.join(rootDir, "src", "level", "levelData.js");
const levelCatalogPath = path.join(rootDir, "src", "level", "levelCatalog.js");

mkdirSync(levelsDir, { recursive: true });

function createRows(width, height, fill = ".") {
  return Array.from({ length: height }, () => fill.repeat(width).split(""));
}

function setRange(rows, y, startX, endX, value = "#") {
  for (let x = startX; x <= endX; x += 1) {
    if (!rows[y] || x < 0 || x >= rows[y].length) {
      continue;
    }

    rows[y][x] = value;
  }
}

function carve(rows, y, startX, endX) {
  setRange(rows, y, startX, endX, ".");
}

function finalizeRows(rows) {
  return rows.map((row) => row.join(""));
}

function addStandardShell(rows, width) {
  setRange(rows, 0, 0, width - 1, "#");
  setRange(rows, 13, 0, width - 1, "#");
  setRange(rows, 14, 0, width - 1, "#");
}

function addPlatform(rows, y, startX, endX) {
  setRange(rows, y, startX, endX, "#");
}

function addGap(rows, startX, endX) {
  carve(rows, 13, startX, endX);
  carve(rows, 14, startX, endX);
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

function ceilingSpikeRun(objects, startX, count, y = 1, gap = 2, color = "#ff9fd4") {
  spikeRow(objects, startX, count, y, "down", gap, color);
}

function addJumpPad(objects, x, power = 1.28, color = "#ffe57a") {
  objects.push({
    type: "jumpPad",
    x,
    y: 12.75,
    width: 1,
    height: 0.25,
    power,
    color
  });
}

function addGravityPortal(objects, x, targetGravity, y = 9) {
  objects.push({
    type: "portal",
    portalType: "gravity",
    x,
    y,
    width: 1,
    height: 3,
    targetGravity
  });
}

function addSpeedPortal(objects, x, speedMultiplier, y = 9) {
  objects.push({
    type: "portal",
    portalType: "speed",
    x,
    y,
    width: 1,
    height: 3,
    speedMultiplier
  });
}

function addMovingPlatform(objects, x, y, {
  width = 2,
  height = 0.5,
  axis = "y",
  distance = 2,
  speed = 72,
  color = "#9fe0ff"
} = {}) {
  objects.push({
    type: "movingPlatform",
    x,
    y,
    width,
    height,
    axis,
    distance,
    speed,
    color
  });
}

function addCheckpoint(objects, x, y = 10.5, color = "#ffe57a") {
  objects.push({
    type: "checkpoint",
    x,
    y,
    width: 0.4,
    height: 2,
    color
  });
}

function addBlock(objects, x, y, width = 2, height = 1, color = "#355374") {
  objects.push({
    type: "block",
    x,
    y,
    width,
    height,
    color
  });
}

function buildLevelPayload({
  id,
  name,
  description,
  difficulty,
  width,
  baseSpeed,
  songId,
  colors,
  rows,
  objects,
  finishX = width - 5
}) {
  return {
    id,
    name,
    description,
    width,
    height: rows.length,
    tileSize: 48,
    baseSpeed,
    finishX,
    songId,
    meta: {
      author: "Codex",
      difficulty
    },
    player: {
      spawnX: 4,
      spawnY: 12.25
    },
    colors,
    tiles: {
      solids: finalizeRows(rows)
    },
    objects
  };
}

function moduleGravityLift(rows, objects, offset, options = {}) {
  addPlatform(rows, 7, offset + 34, offset + 62);
  addGap(rows, offset + 48, offset + 52);

  spikeRow(objects, offset + 9, options.startSpikeCount ?? 4, 12, "up", options.startSpikeGap ?? 2);
  addJumpPad(objects, offset + 18, options.padPower ?? 1.3);
  spikeRow(objects, offset + 23, options.midSpikeCount ?? 3, 12, "up", options.midSpikeGap ?? 2);
  addGravityPortal(objects, offset + 31, -1, 9);
  ceilingSpikeRun(objects, offset + 36, options.ceilingCount ?? 6, 1, options.ceilingGap ?? 2);
  addSpeedPortal(objects, offset + 45, options.speedMultiplier ?? 1.45, 6);
  addMovingPlatform(objects, offset + 48, 12, {
    axis: options.platformAxis ?? "y",
    distance: options.platformDistance ?? 2,
    speed: options.platformSpeed ?? 72,
    color: options.platformColor ?? "#7bf7ff"
  });
  addGravityPortal(objects, offset + 58, 1, 6);
}

function moduleSwitchback(rows, objects, offset, options = {}) {
  addPlatform(rows, 8, offset + 24, offset + 49);
  addGap(rows, offset + 52, offset + 56);

  spikeRow(objects, offset + 2, options.startCount ?? 4, 12, "up", 2);

  if (options.checkpoint !== false) {
    addCheckpoint(objects, offset + 14);
  }

  addJumpPad(objects, offset + 20, options.padPower ?? 1.2);
  spikeRow(objects, offset + 28, options.downSpikeCount ?? 3, 7, "down", 2, "#ff9fd4");
  addGravityPortal(objects, offset + 40, -1, 9);
  ceilingSpikeRun(objects, offset + 46, options.ceilingCount ?? 4, 1, options.ceilingGap ?? 3);
  addGravityPortal(objects, offset + 54, 1, 6);
  addMovingPlatform(objects, offset + 52, 12, {
    axis: "x",
    distance: options.platformDistance ?? 3,
    speed: options.platformSpeed ?? 58,
    color: options.platformColor ?? "#89ffb0"
  });

  if (options.speedMultiplier) {
    addSpeedPortal(objects, offset + 58, options.speedMultiplier, 9);
  }

  if (options.endSpikeCount) {
    spikeRow(objects, offset + 60, options.endSpikeCount, 12, "up", 2);
  }
}

function moduleVelocityNest(rows, objects, offset, options = {}) {
  addPlatform(rows, 9, offset + 12, offset + 34);
  addPlatform(rows, 8, offset + 50, offset + 70);
  addGap(rows, offset + 60, offset + 64);

  spikeRow(objects, offset + 0, options.startCount ?? 5, 12, "up", 2);
  addSpeedPortal(objects, offset + 12, options.speedMultiplier ?? 1.55, 9);
  addBlock(objects, offset + 20, 10, 2, 1, options.blockColorA ?? "#355374");
  addBlock(objects, offset + 23, 9, 2, 1, options.blockColorB ?? "#355374");
  addJumpPad(objects, offset + 27, options.padPower ?? 1.34);
  addGravityPortal(objects, offset + 40, -1, 9);
  ceilingSpikeRun(objects, offset + 46, options.ceilingCount ?? 5, 1, options.ceilingGap ?? 2);
  addMovingPlatform(objects, offset + 60, 12, {
    axis: "y",
    distance: options.platformDistance ?? 2,
    speed: options.platformSpeed ?? 74,
    color: options.platformColor ?? "#9fe0ff"
  });
  addGravityPortal(objects, offset + 68, 1, 6);
  spikeRow(objects, offset + 75, options.endCount ?? 5, 12, "up", 2);
  addJumpPad(objects, offset + 87, options.endPadPower ?? 1.35);

  if (options.checkpoint) {
    addCheckpoint(objects, offset + 72);
  }
}

function moduleOrbitalClimb(rows, objects, offset, options = {}) {
  addPlatform(rows, 10, offset + 14, offset + 28);
  addPlatform(rows, 6, offset + 38, offset + 58);
  addPlatform(rows, 9, offset + 70, offset + 90);
  addGap(rows, offset + 22, offset + 26);
  addGap(rows, offset + 76, offset + 80);

  spikeRow(objects, offset + 4, options.introSpikeCount ?? 3, 12, "up", 2);
  addMovingPlatform(objects, offset + 22, 12, {
    axis: "y",
    distance: options.platformDistance ?? 3,
    speed: options.platformSpeed ?? 78,
    color: options.platformColor ?? "#9fe0ff"
  });
  addJumpPad(objects, offset + 32, options.padPower ?? 1.28);
  spikeRow(objects, offset + 35, options.midDownSpikeCount ?? 2, 5, "down", 3, "#ff9fd4");
  addGravityPortal(objects, offset + 40, -1, 7);
  ceilingSpikeRun(objects, offset + 46, options.ceilingCount ?? 7, 1, 2);
  addSpeedPortal(objects, offset + 56, options.speedMultiplier ?? 1.58, 6);
  addGravityPortal(objects, offset + 64, 1, 6);
  spikeRow(objects, offset + 72, options.endSpikeCount ?? 4, 12, "up", 2);

  if (options.checkpoint !== false) {
    addCheckpoint(objects, offset + 86);
  }

  addJumpPad(objects, offset + 92, options.endPadPower ?? 1.36);
}

function moduleApexGauntlet(rows, objects, offset, options = {}) {
  addPlatform(rows, 8, offset + 14, offset + 30);
  addPlatform(rows, 7, offset + 42, offset + 60);
  addPlatform(rows, 9, offset + 72, offset + 88);
  addPlatform(rows, 8, offset + 98, offset + 114);
  addGap(rows, offset + 18, offset + 22);
  addGap(rows, offset + 52, offset + 56);
  addGap(rows, offset + 82, offset + 86);

  spikeRow(objects, offset + 0, options.introSpikeCount ?? 4, 12, "up", 2);
  addSpeedPortal(objects, offset + 8, options.speedMultiplier ?? 1.65, 9);
  addJumpPad(objects, offset + 12, options.padPower ?? 1.3);
  spikeRow(objects, offset + 24, options.midSpikeCount ?? 4, 12, "up", 2);
  addGravityPortal(objects, offset + 34, -1, 9);
  ceilingSpikeRun(objects, offset + 38, options.ceilingCount ?? 5, 1, 2);
  addMovingPlatform(objects, offset + 48, 12, {
    axis: "x",
    distance: options.platformDistance ?? 3,
    speed: options.platformSpeed ?? 68,
    color: options.platformColor ?? "#89ffb0"
  });
  addGravityPortal(objects, offset + 52, 1, 6);
  addSpeedPortal(objects, offset + 66, options.secondSpeedMultiplier ?? 1.72, 9);
  spikeRow(objects, offset + 76, options.lateSpikeCount ?? 6, 12, "up", 2);
  addJumpPad(objects, offset + 90, options.endPadPower ?? 1.38);
  addGravityPortal(objects, offset + 96, -1, 9);
  ceilingSpikeRun(objects, offset + 100, options.tailCeilingCount ?? 4, 1, 3);
  addGravityPortal(objects, offset + 110, 1, 6);

  if (options.finalSpikeCount) {
    spikeRow(objects, offset + 114, options.finalSpikeCount, 12, "up", 2);
  }
}

const MODULE_BUILDERS = {
  gravityLift: moduleGravityLift,
  switchback: moduleSwitchback,
  velocityNest: moduleVelocityNest,
  orbitalClimb: moduleOrbitalClimb,
  apexGauntlet: moduleApexGauntlet
};

function buildChallengeLevel(spec) {
  const rows = createRows(spec.width, 15);
  addStandardShell(rows, spec.width);
  const objects = [];

  for (const segment of spec.segments) {
    MODULE_BUILDERS[segment.type](rows, objects, segment.offset, segment.options ?? {});
  }

  return buildLevelPayload({
    id: spec.id,
    name: spec.name,
    description: spec.description,
    difficulty: spec.difficulty,
    width: spec.width,
    baseSpeed: spec.baseSpeed,
    songId: spec.songId,
    colors: spec.colors,
    rows,
    objects,
    finishX: spec.finishX ?? spec.width - 5
  });
}

function makeLevelOne() {
  const width = 176;
  const rows = createRows(width, 15);

  addStandardShell(rows, width);
  addPlatform(rows, 8, 42, 64);
  addPlatform(rows, 8, 112, 132);
  addPlatform(rows, 7, 148, 164);
  addPlatform(rows, 10, 84, 91);
  addPlatform(rows, 10, 100, 107);
  addGap(rows, 80, 84);
  addGap(rows, 118, 121);

  const objects = [];
  spikeRow(objects, 10, 3, 12);
  spikeRow(objects, 18, 2, 12, "up", 3);
  addJumpPad(objects, 24, 1.28);
  spikeRow(objects, 28, 3, 12);
  addGravityPortal(objects, 38, -1, 9);
  ceilingSpikeRun(objects, 44, 7, 1, 2);
  addBlock(objects, 54, 4, 2, 1, "#395b84");
  addGravityPortal(objects, 62, 1, 6);
  spikeRow(objects, 69, 2, 12, "up", 3);
  addSpeedPortal(objects, 74, 1.32, 9);
  addMovingPlatform(objects, 80, 12, { axis: "y", distance: 2, speed: 66, color: "#9fe0ff" });
  addCheckpoint(objects, 93, 10.5);
  spikeRow(objects, 99, 4, 12, "up", 2);
  addJumpPad(objects, 108, 1.24);
  objects.push({ type: "spike", x: 114, y: 12, width: 1, height: 1, direction: "up", color: "#ff6e96" });
  addGravityPortal(objects, 120, -1, 9);
  ceilingSpikeRun(objects, 124, 5, 1, 3);
  addGravityPortal(objects, 136, 1, 6);
  addMovingPlatform(objects, 144, 10.5, { axis: "x", distance: 3, speed: 54, color: "#89ffb0" });
  spikeRow(objects, 151, 3, 12, "up", 2);
  addJumpPad(objects, 158, 1.32);
  spikeRow(objects, 164, 2, 12, "up", 2);

  return buildLevelPayload({
    id: "level-01",
    name: "Neon Run",
    description: "Intro course with steady rhythm, bounce timing, gravity flips, and moving-platform recovery sections.",
    difficulty: "Normal",
    width,
    baseSpeed: 240,
    songId: "neonPulse",
    colors: {
      skyTop: "#102744",
      skyBottom: "#05101d",
      glow: "#7bf7ff",
      accent: "#ffe57a",
      tile: "#23496d"
    },
    rows,
    objects,
    finishX: 171
  });
}

const hardLevelSpecs = [
  {
    id: "level-02",
    name: "Gravity Groove",
    description: "Faster sections with back-to-back gravity routing, moving platforms, and denser spike timing.",
    difficulty: "Hard",
    width: 224,
    baseSpeed: 240,
    songId: "gravityDrive",
    colors: {
      skyTop: "#24133f",
      skyBottom: "#07101d",
      glow: "#89ffb0",
      accent: "#7bf7ff",
      tile: "#3d3d7d"
    },
    finishX: 219,
    segments: [
      { type: "gravityLift", offset: 0, options: { speedMultiplier: 1.45, platformSpeed: 72 } },
      { type: "switchback", offset: 64, options: { platformSpeed: 58 } },
      { type: "velocityNest", offset: 126, options: { speedMultiplier: 1.55, platformSpeed: 74 } }
    ]
  },
  {
    id: "level-03",
    name: "Pulse Breaker",
    description: "A longer gauntlet that layers the Gravity Groove patterns into a tighter four-section route.",
    difficulty: "Hard",
    width: 308,
    baseSpeed: 244,
    songId: "neonPulse",
    colors: {
      skyTop: "#15254d",
      skyBottom: "#06111f",
      glow: "#7bf7ff",
      accent: "#ffde72",
      tile: "#29496f"
    },
    segments: [
      { type: "gravityLift", offset: 0, options: { speedMultiplier: 1.48, startSpikeCount: 5, ceilingCount: 7, platformSpeed: 74 } },
      { type: "switchback", offset: 64, options: { startCount: 5, ceilingCount: 5, platformSpeed: 62 } },
      { type: "velocityNest", offset: 126, options: { speedMultiplier: 1.58, ceilingCount: 6, endCount: 6, platformSpeed: 78 } },
      { type: "switchback", offset: 224, options: { startCount: 5, ceilingCount: 5, platformSpeed: 64, speedMultiplier: 1.46 } }
    ]
  },
  {
    id: "level-04",
    name: "Ceiling Burn",
    description: "Longer ceiling routes and faster orbital recoveries force cleaner portal timing on every swap.",
    difficulty: "Hard+",
    width: 338,
    baseSpeed: 246,
    songId: "gravityDrive",
    colors: {
      skyTop: "#31194e",
      skyBottom: "#08111f",
      glow: "#89ffb0",
      accent: "#ffe57a",
      tile: "#4a356f"
    },
    segments: [
      { type: "gravityLift", offset: 0, options: { speedMultiplier: 1.5, startSpikeCount: 5, midSpikeCount: 4, ceilingCount: 7, platformSpeed: 76 } },
      { type: "orbitalClimb", offset: 64, options: { introSpikeCount: 4, ceilingCount: 8, endSpikeCount: 5, platformSpeed: 82, speedMultiplier: 1.6 } },
      { type: "switchback", offset: 168, options: { startCount: 5, ceilingCount: 6, platformSpeed: 64 } },
      { type: "velocityNest", offset: 230, options: { speedMultiplier: 1.6, startCount: 6, ceilingCount: 6, endCount: 6, platformSpeed: 80 } }
    ]
  },
  {
    id: "level-05",
    name: "Velocity Vault",
    description: "Portal pressure ramps up here, with denser spikes and a brutal apex corridor in the middle.",
    difficulty: "Hard+",
    width: 362,
    baseSpeed: 248,
    songId: "neonPulse",
    colors: {
      skyTop: "#132f45",
      skyBottom: "#06121d",
      glow: "#9fe0ff",
      accent: "#ffcc73",
      tile: "#2e5771"
    },
    segments: [
      { type: "gravityLift", offset: 0, options: { speedMultiplier: 1.52, startSpikeCount: 5, platformSpeed: 76 } },
      { type: "switchback", offset: 64, options: { startCount: 5, ceilingCount: 6, platformSpeed: 66 } },
      { type: "apexGauntlet", offset: 126, options: { introSpikeCount: 5, midSpikeCount: 5, ceilingCount: 6, lateSpikeCount: 7, secondSpeedMultiplier: 1.74, finalSpikeCount: 3 } },
      { type: "velocityNest", offset: 256, options: { speedMultiplier: 1.62, startCount: 6, ceilingCount: 6, endCount: 7, platformSpeed: 82 } }
    ]
  },
  {
    id: "level-06",
    name: "Orbit Steps",
    description: "Alternating orbital climbs and velocity corridors leave almost no room for sloppy landings.",
    difficulty: "Expert",
    width: 446,
    baseSpeed: 250,
    songId: "gravityDrive",
    colors: {
      skyTop: "#25144a",
      skyBottom: "#09111c",
      glow: "#7bf7ff",
      accent: "#89ffb0",
      tile: "#4e3578"
    },
    segments: [
      { type: "orbitalClimb", offset: 0, options: { introSpikeCount: 4, ceilingCount: 8, endSpikeCount: 5, platformSpeed: 84, speedMultiplier: 1.6 } },
      { type: "gravityLift", offset: 104, options: { startSpikeCount: 5, midSpikeCount: 4, ceilingCount: 8, speedMultiplier: 1.54, platformSpeed: 78 } },
      { type: "velocityNest", offset: 170, options: { speedMultiplier: 1.64, startCount: 6, ceilingCount: 7, endCount: 7, platformSpeed: 84 } },
      { type: "switchback", offset: 270, options: { startCount: 6, ceilingCount: 6, platformSpeed: 68 } },
      { type: "orbitalClimb", offset: 334, options: { introSpikeCount: 5, ceilingCount: 8, endSpikeCount: 6, platformSpeed: 86, speedMultiplier: 1.62 } }
    ]
  },
  {
    id: "level-07",
    name: "Shock Circuit",
    description: "Speed spikes hard here, and the orbital finish punishes every late jump on the floor route.",
    difficulty: "Expert+",
    width: 468,
    baseSpeed: 252,
    songId: "neonPulse",
    colors: {
      skyTop: "#103145",
      skyBottom: "#061019",
      glow: "#89ffb0",
      accent: "#ffd778",
      tile: "#27586e"
    },
    segments: [
      { type: "gravityLift", offset: 0, options: { startSpikeCount: 6, midSpikeCount: 4, ceilingCount: 8, speedMultiplier: 1.56, platformSpeed: 80 } },
      { type: "apexGauntlet", offset: 64, options: { introSpikeCount: 5, midSpikeCount: 5, ceilingCount: 6, lateSpikeCount: 7, secondSpeedMultiplier: 1.76, finalSpikeCount: 4 } },
      { type: "switchback", offset: 188, options: { startCount: 6, ceilingCount: 7, platformSpeed: 70 } },
      { type: "velocityNest", offset: 252, options: { speedMultiplier: 1.66, startCount: 6, ceilingCount: 7, endCount: 8, platformSpeed: 84 } },
      { type: "orbitalClimb", offset: 350, options: { introSpikeCount: 5, ceilingCount: 9, endSpikeCount: 6, platformSpeed: 88, speedMultiplier: 1.64 } }
    ]
  },
  {
    id: "level-08",
    name: "Sky Splitter",
    description: "This level blends vertical gaps and ceiling pressure into a long sequence with almost no safe slack.",
    difficulty: "Insane",
    width: 478,
    baseSpeed: 254,
    songId: "gravityDrive",
    colors: {
      skyTop: "#34194d",
      skyBottom: "#08101a",
      glow: "#9fe0ff",
      accent: "#89ffb0",
      tile: "#523880"
    },
    segments: [
      { type: "orbitalClimb", offset: 0, options: { introSpikeCount: 5, ceilingCount: 9, endSpikeCount: 6, platformSpeed: 88, speedMultiplier: 1.64 } },
      { type: "switchback", offset: 104, options: { startCount: 6, ceilingCount: 7, platformSpeed: 70 } },
      { type: "apexGauntlet", offset: 170, options: { introSpikeCount: 6, midSpikeCount: 5, ceilingCount: 7, lateSpikeCount: 8, secondSpeedMultiplier: 1.78, finalSpikeCount: 4 } },
      { type: "velocityNest", offset: 294, options: { speedMultiplier: 1.68, startCount: 7, ceilingCount: 7, endCount: 8, platformSpeed: 86 } },
      { type: "switchback", offset: 392, options: { startCount: 7, ceilingCount: 8, platformSpeed: 72, speedMultiplier: 1.5 } }
    ]
  },
  {
    id: "level-09",
    name: "Core Surge",
    description: "An endurance test with brutal routing changes and repeated speed resets deep into the run.",
    difficulty: "Insane+",
    width: 564,
    baseSpeed: 256,
    songId: "neonPulse",
    colors: {
      skyTop: "#153247",
      skyBottom: "#051019",
      glow: "#7bf7ff",
      accent: "#ffe57a",
      tile: "#28556e"
    },
    segments: [
      { type: "gravityLift", offset: 0, options: { startSpikeCount: 6, midSpikeCount: 5, ceilingCount: 8, speedMultiplier: 1.58, platformSpeed: 82 } },
      { type: "orbitalClimb", offset: 64, options: { introSpikeCount: 5, ceilingCount: 9, endSpikeCount: 6, platformSpeed: 90, speedMultiplier: 1.66 } },
      { type: "velocityNest", offset: 170, options: { speedMultiplier: 1.7, startCount: 7, ceilingCount: 8, endCount: 9, platformSpeed: 88 } },
      { type: "apexGauntlet", offset: 268, options: { introSpikeCount: 6, midSpikeCount: 6, ceilingCount: 7, lateSpikeCount: 8, secondSpeedMultiplier: 1.8, finalSpikeCount: 5 } },
      { type: "switchback", offset: 392, options: { startCount: 7, ceilingCount: 8, platformSpeed: 74, speedMultiplier: 1.52 } },
      { type: "velocityNest", offset: 456, options: { speedMultiplier: 1.72, startCount: 8, ceilingCount: 8, endCount: 9, platformSpeed: 90 } }
    ]
  },
  {
    id: "level-10",
    name: "Apex Rush",
    description: "The final course chains every hard pattern together into one long, high-speed mastery run.",
    difficulty: "Master",
    width: 632,
    baseSpeed: 258,
    songId: "gravityDrive",
    colors: {
      skyTop: "#35184e",
      skyBottom: "#060f18",
      glow: "#89ffb0",
      accent: "#7bf7ff",
      tile: "#583885"
    },
    finishX: 627,
    segments: [
      { type: "orbitalClimb", offset: 0, options: { introSpikeCount: 6, ceilingCount: 9, endSpikeCount: 6, platformSpeed: 92, speedMultiplier: 1.66 } },
      { type: "gravityLift", offset: 104, options: { startSpikeCount: 6, midSpikeCount: 5, ceilingCount: 9, speedMultiplier: 1.6, platformSpeed: 84 } },
      { type: "apexGauntlet", offset: 168, options: { introSpikeCount: 6, midSpikeCount: 6, ceilingCount: 8, lateSpikeCount: 9, secondSpeedMultiplier: 1.82, finalSpikeCount: 5 } },
      { type: "velocityNest", offset: 294, options: { speedMultiplier: 1.72, startCount: 8, ceilingCount: 8, endCount: 9, platformSpeed: 90 } },
      { type: "orbitalClimb", offset: 390, options: { introSpikeCount: 6, ceilingCount: 10, endSpikeCount: 7, platformSpeed: 94, speedMultiplier: 1.68 } },
      { type: "apexGauntlet", offset: 496, options: { introSpikeCount: 7, midSpikeCount: 6, ceilingCount: 8, lateSpikeCount: 9, secondSpeedMultiplier: 1.84, finalSpikeCount: 6 } }
    ]
  }
];

function writeLevel(fileName, data) {
  writeFileSync(path.join(levelsDir, fileName), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const generatedLevels = [
  makeLevelOne(),
  ...hardLevelSpecs.map((spec) => buildChallengeLevel(spec))
];

const levelDataById = Object.fromEntries(generatedLevels.map((level) => [level.id, level]));
const generatedCatalog = generatedLevels.map((level, index) => ({
  id: level.id,
  name: level.name,
  description: level.description,
  difficulty: level.meta.difficulty,
  songId: level.songId,
  order: index + 1,
  file: `./levels/${level.id}.json`
}));

for (const level of generatedLevels) {
  writeLevel(`${level.id}.json`, level);
}

writeFileSync(
  levelDataModulePath,
  `export const LEVEL_DATA = ${JSON.stringify(levelDataById, null, 2)};\n`,
  "utf8"
);

writeFileSync(
  levelCatalogPath,
  `export const LEVEL_CATALOG = ${JSON.stringify(generatedCatalog, null, 2)};\n`,
  "utf8"
);

console.log(`Generated ${generatedLevels.length} level files in ${levelsDir}`);
