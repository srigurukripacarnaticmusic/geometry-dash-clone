import { GAME_CONFIG } from "../config/gameConfig.js";

const DEFAULT_SAVE = {
  settings: {
    doubleJumpMode: false,
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
    return {
      settings: {
        ...DEFAULT_SAVE.settings,
        ...(data?.settings ?? {})
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

  setVolume(value) {
    this.data.settings.masterVolume = value;
    this.commit();
  }

  setDoubleJumpMode(enabled) {
    this.data.settings.doubleJumpMode = enabled;
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
