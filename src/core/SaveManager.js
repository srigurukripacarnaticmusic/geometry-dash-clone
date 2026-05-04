import { GAME_CONFIG } from "../config/gameConfig.js";

const DEFAULT_SAVE = {
  settings: {
    jumpMode: "single",
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
    const legacyJumpMode = storedSettings.jumpMode
      ?? (storedSettings.doubleJumpMode ? "double" : "single");

    return {
      settings: {
        jumpMode: this.normalizeJumpMode(legacyJumpMode),
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

  normalizeJumpMode(mode, allowTriple = true) {
    const normalized = ["single", "double", "triple"].includes(mode) ? mode : "single";

    if (normalized === "triple" && !allowTriple) {
      return "double";
    }

    return normalized;
  }

  isTripleJumpUnlocked() {
    return this.progress.completedLevels.includes("level-01");
  }

  getEffectiveJumpMode() {
    return this.normalizeJumpMode(this.settings.jumpMode, this.isTripleJumpUnlocked());
  }

  setVolume(value) {
    this.data.settings.masterVolume = value;
    this.commit();
  }

  setDoubleJumpMode(enabled) {
    const currentMode = this.getEffectiveJumpMode();

    if (!enabled) {
      this.data.settings.jumpMode = "single";
      this.commit();
      return;
    }

    this.data.settings.jumpMode = currentMode === "triple" ? "triple" : "double";
    this.commit();
  }

  setTripleJumpMode(enabled) {
    const tripleUnlocked = this.isTripleJumpUnlocked();

    if (enabled && tripleUnlocked) {
      this.data.settings.jumpMode = "triple";
      this.commit();
      return;
    }

    if (this.getEffectiveJumpMode() === "triple") {
      this.data.settings.jumpMode = "double";
      this.commit();
    }
  }

  setJumpMode(mode) {
    this.data.settings.jumpMode = this.normalizeJumpMode(mode, this.isTripleJumpUnlocked());
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
      this.data.settings.jumpMode = this.normalizeJumpMode(this.data.settings.jumpMode, this.isTripleJumpUnlocked());
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
