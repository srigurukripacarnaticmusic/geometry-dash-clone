import { GAME_CONFIG } from "../config/gameConfig.js";
import { LEVEL_CATALOG } from "../level/levelCatalog.js";

const ORDERED_LEVELS = [...LEVEL_CATALOG].sort((first, second) => first.order - second.order);
const LEVEL_META_BY_ID = new Map(ORDERED_LEVELS.map((level) => [level.id, level]));
const LEGACY_JUMP_COUNTS = {
  single: 1,
  double: 2,
  triple: 3
};

const DEFAULT_SAVE = {
  settings: {
    jumpCount: 1,
    touchControls: false,
    masterVolume: GAME_CONFIG.audio.masterVolume
  },
  progress: {
    unlockedLevels: ["level-01"],
    bestPercentByLevel: {},
    completedLevels: []
  }
};

export class SaveManager {
  constructor(storageKey = GAME_CONFIG.storageKeys.saveData) {
    this.storageKey = storageKey;
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);

      if (!raw) {
        return structuredClone(DEFAULT_SAVE);
      }

      return this.mergeDefaults(JSON.parse(raw));
    } catch (error) {
      console.warn("Failed to load save data, resetting to defaults.", error);
      return structuredClone(DEFAULT_SAVE);
    }
  }

  mergeDefaults(data) {
    const storedSettings = data?.settings ?? {};
    const jumpCount = this.resolveStoredJumpCount(storedSettings, data?.progress);

    return {
      settings: {
        jumpCount,
        touchControls: storedSettings.touchControls ?? DEFAULT_SAVE.settings.touchControls,
        masterVolume: storedSettings.masterVolume ?? DEFAULT_SAVE.settings.masterVolume
      },
      progress: {
        ...DEFAULT_SAVE.progress,
        ...(data?.progress ?? {})
      }
    };
  }

  commit() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  get settings() {
    return this.data.settings;
  }

  get progress() {
    return this.data.progress;
  }

  resolveStoredJumpCount(storedSettings, progress = this.progress) {
    const parsedJumpCount = Number.parseInt(storedSettings.jumpCount, 10);

    if (Number.isFinite(parsedJumpCount)) {
      return this.normalizeJumpCount(parsedJumpCount, this.getUnlockedJumpCap(progress));
    }

    const legacyMode = storedSettings.jumpMode
      ?? (storedSettings.doubleJumpMode ? "double" : "single");
    const legacyJumpCount = LEGACY_JUMP_COUNTS[legacyMode] ?? DEFAULT_SAVE.settings.jumpCount;
    return this.normalizeJumpCount(legacyJumpCount, this.getUnlockedJumpCap(progress));
  }

  getHighestUnlockedLevelOrder(progress = this.progress) {
    const unlockedLevels = new Set(progress?.unlockedLevels ?? []);
    let highestOrder = ORDERED_LEVELS[0]?.order ?? 0;

    for (const level of ORDERED_LEVELS) {
      if (unlockedLevels.has(level.id)) {
        highestOrder = Math.max(highestOrder, level.order);
      }
    }

    return highestOrder;
  }

  getUnlockedJumpCap(progress = this.progress) {
    return Math.max(1, this.getHighestUnlockedLevelOrder(progress) + 1);
  }

  getLevelJumpCap(levelId) {
    const level = LEVEL_META_BY_ID.get(levelId);
    return level ? Math.max(1, level.order + 1) : this.getUnlockedJumpCap();
  }

  normalizeJumpCount(jumpCount, maxJumpCount = this.getUnlockedJumpCap()) {
    const parsedCount = Number.parseInt(jumpCount, 10);
    const safeMax = Math.max(1, Number.parseInt(maxJumpCount, 10) || 1);
    const safeCount = Number.isFinite(parsedCount) ? parsedCount : DEFAULT_SAVE.settings.jumpCount;
    return Math.max(1, Math.min(safeMax, safeCount));
  }

  getEffectiveJumpCount(levelId = null) {
    const maxJumpCount = levelId ? this.getLevelJumpCap(levelId) : this.getUnlockedJumpCap();
    return this.normalizeJumpCount(this.settings.jumpCount, maxJumpCount);
  }

  getJumpCountLabel(levelId = null) {
    const jumpCount = this.getEffectiveJumpCount(levelId);
    return `${jumpCount} ${jumpCount === 1 ? "Jump" : "Jumps"}`;
  }

  setVolume(value) {
    this.data.settings.masterVolume = value;
    this.commit();
  }

  setJumpCount(jumpCount) {
    this.data.settings.jumpCount = this.normalizeJumpCount(jumpCount);
    this.commit();
  }

  setTouchControls(enabled) {
    this.data.settings.touchControls = enabled;
    this.commit();
  }

  unlockLevel(levelId) {
    if (!this.progress.unlockedLevels.includes(levelId)) {
      this.progress.unlockedLevels.push(levelId);
      this.commit();
    }
  }

  markComplete(levelId) {
    if (!this.progress.completedLevels.includes(levelId)) {
      this.progress.completedLevels.push(levelId);
      this.data.settings.jumpCount = this.normalizeJumpCount(this.data.settings.jumpCount);
      this.commit();
    }
  }

  setBestPercent(levelId, progress) {
    const currentBest = this.progress.bestPercentByLevel[levelId] ?? 0;

    if (progress > currentBest) {
      this.progress.bestPercentByLevel[levelId] = progress;
      this.commit();
    }
  }

  reset() {
    this.data = structuredClone(DEFAULT_SAVE);
    this.commit();
  }
}
