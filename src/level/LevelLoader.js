import { LEVEL_CATALOG } from "./levelCatalog.js";
import { Level } from "./Level.js";
import { LEVEL_DATA } from "./levelData.js";

export class LevelLoader {
  constructor() {
    this.catalog = LEVEL_CATALOG;
    this.cache = new Map();
  }

  getCatalog() {
    return this.catalog;
  }

  getLevelMeta(levelId) {
    return this.catalog.find((level) => level.id === levelId) ?? null;
  }

  getNextLevelId(levelId) {
    const sorted = [...this.catalog].sort((a, b) => a.order - b.order);
    const currentIndex = sorted.findIndex((level) => level.id === levelId);

    if (currentIndex === -1 || currentIndex === sorted.length - 1) {
      return null;
    }

    return sorted[currentIndex + 1].id;
  }

  async loadLevel(levelId) {
    if (this.cache.has(levelId)) {
      return new Level(structuredClone(this.cache.get(levelId)));
    }

    const meta = this.getLevelMeta(levelId);

    if (!meta) {
      throw new Error(`Unknown level id: ${levelId}`);
    }

    const data = LEVEL_DATA[levelId];

    if (!data) {
      throw new Error(`Missing in-memory level data for "${levelId}".`);
    }

    this.cache.set(levelId, data);
    return new Level(structuredClone(data));
  }
}
