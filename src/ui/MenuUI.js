import { formatPercent } from "../utils/math.js";

export class MenuUI {
  constructor(game) {
    this.game = game;
    this.toastTimer = null;
    this.pendingNextLevelId = null;
    this.transitionLocked = false;

    this.elements = {
      hud: document.getElementById("hud"),
      hudLevelName: document.getElementById("hudLevelName"),
      hudAttempt: document.getElementById("hudAttempt"),
      hudMode: document.getElementById("hudMode"),
      progressFill: document.getElementById("progressFill"),
      progressPulse: document.getElementById("progressPulse"),
      progressLabel: document.getElementById("progressLabel"),
      editorBanner: document.getElementById("editorBanner"),
      editorPanel: document.getElementById("editorPanel"),
      editorSelectionLabel: document.getElementById("editorSelectionLabel"),
      touchControls: document.getElementById("touchControls"),
      toast: document.getElementById("toast"),
      gameOverFlash: document.getElementById("gameOverFlash"),
      jumpCountSlider: document.getElementById("jumpCountSlider"),
      jumpCountValue: document.getElementById("jumpCountValue"),
      jumpCountHint: document.getElementById("jumpCountHint"),
      touchToggle: document.getElementById("touchToggle"),
      volumeSlider: document.getElementById("volumeSlider"),
      levelGrid: document.getElementById("levelGrid"),
      completeText: document.getElementById("completeText"),
      screens: {
        menu: document.getElementById("screenMenu"),
        levelSelect: document.getElementById("screenLevelSelect"),
        pause: document.getElementById("screenPause"),
        complete: document.getElementById("screenComplete"),
        loading: document.getElementById("screenLoading")
      }
    };

    this.bindEvents();
    this.syncSettings();
  }

  bindEvents() {
    document.getElementById("startGameButton")?.addEventListener("click", () => {
      const firstLevel = this.game.levelLoader.getCatalog()[0]?.id;
      this.game.playLevel(firstLevel);
    });

    document.getElementById("levelSelectButton")?.addEventListener("click", () => {
      this.game.openLevelSelect();
    });

    document.getElementById("backToMenuButton")?.addEventListener("click", () => {
      this.game.openMenu();
    });

    document.getElementById("resumeButton")?.addEventListener("click", () => {
      this.game.resumeCurrentPause();
    });

    document.getElementById("restartButton")?.addEventListener("click", () => {
      this.game.restartCurrentLevel();
    });

    document.getElementById("exitLevelButton")?.addEventListener("click", () => {
      this.game.exitToMenu();
    });

    document.getElementById("nextLevelButton")?.addEventListener("click", () => {
      if (this.pendingNextLevelId) {
        this.game.playLevel(this.pendingNextLevelId);
        return;
      }

      this.game.openLevelSelect();
    });

    document.getElementById("completeToMenuButton")?.addEventListener("click", () => {
      this.game.openMenu();
    });

    this.elements.jumpCountSlider?.addEventListener("input", (event) => {
      const jumpCount = Number.parseInt(event.target.value, 10);
      this.game.saveManager.setJumpCount(jumpCount);
      this.syncSettings();
      this.game.applySettingsToActivePlayState();
    });

    this.elements.touchToggle?.addEventListener("change", (event) => {
      const enabled = event.target.checked;
      this.game.saveManager.setTouchControls(enabled);
      this.game.touchControls.setVisible(enabled);
    });

    this.elements.volumeSlider?.addEventListener("input", (event) => {
      const volume = Number.parseInt(event.target.value, 10) / 100;
      this.game.saveManager.setVolume(volume);
      this.game.audio.setMasterVolume(volume);
    });
  }

  syncSettings() {
    const { settings } = this.game.saveManager;
    const unlockedJumpCap = this.game.saveManager.getUnlockedJumpCap();
    const selectedJumpCount = this.game.saveManager.getEffectiveJumpCount();

    this.elements.jumpCountSlider.min = "1";
    this.elements.jumpCountSlider.max = String(unlockedJumpCap);
    this.elements.jumpCountSlider.value = String(selectedJumpCount);
    this.elements.jumpCountValue.textContent = this.game.saveManager.getJumpCountLabel();
    this.elements.jumpCountHint.textContent = `Unlocked jump cap: ${unlockedJumpCap}. Each level can use up to its level number plus one jumps, so Level 3 supports 4 jumps.`;
    this.elements.touchToggle.checked = settings.touchControls;
    this.elements.volumeSlider.value = String(Math.round(settings.masterVolume * 100));
  }

  setTransitionLocked(locked) {
    this.transitionLocked = locked;
    document
      .querySelectorAll("#startGameButton, #levelSelectButton, #backToMenuButton, #resumeButton, #restartButton, #exitLevelButton, #nextLevelButton, #completeToMenuButton")
      .forEach((element) => {
        if (element instanceof HTMLButtonElement) {
          element.disabled = locked;
        }
      });
  }

  setScreen(name, active) {
    const screen = this.elements.screens[name];
    screen?.classList.toggle("active", active);
  }

  clearScreens() {
    Object.keys(this.elements.screens).forEach((name) => this.setScreen(name, false));
  }

  showMenu() {
    this.setTransitionLocked(false);
    this.clearScreens();
    this.setScreen("menu", true);
    this.showHUD(false);
    this.touchControls(false);
  }

  showLevelSelect(catalog, progress) {
    this.setTransitionLocked(false);
    this.clearScreens();
    this.setScreen("levelSelect", true);
    this.showHUD(false);
    this.touchControls(false);
    this.renderLevelCards(catalog, progress);
  }

  showPause(active) {
    if (active) {
      this.setTransitionLocked(false);
    }
    this.setScreen("pause", active);
  }

  showLoading(active) {
    this.setTransitionLocked(active);
    this.setScreen("loading", active);
  }

  showComplete({ levelName, nextLevelId }) {
    this.setTransitionLocked(false);
    this.pendingNextLevelId = nextLevelId;
    this.elements.completeText.textContent = nextLevelId
      ? `${levelName} cleared. The next course is unlocked.`
      : `${levelName} cleared. You completed all available levels.`;
    this.setScreen("complete", true);
  }

  hideComplete() {
    this.setScreen("complete", false);
    this.pendingNextLevelId = null;
  }

  showHUD(visible) {
    this.elements.hud.classList.toggle("hidden", !visible);
  }

  updateHUD(data) {
    this.elements.hudLevelName.textContent = data.levelName;
    this.elements.hudAttempt.textContent = String(data.attempt);
    this.elements.hudMode.textContent = data.jumpModeLabel;
    this.elements.progressFill.style.width = `${Math.round(data.progress * 100)}%`;
    this.elements.progressPulse.style.left = `${Math.round(data.progress * 100)}%`;
    this.elements.progressLabel.textContent = formatPercent(data.progress);
    this.elements.progressFill.style.boxShadow = `0 0 ${12 + data.beat * 12}px rgba(123, 247, 255, 0.5)`;
  }

  setEditorVisible(visible, selectionLabel = "Spike") {
    this.elements.editorBanner.classList.toggle("hidden", !visible);
    this.elements.editorPanel.classList.toggle("hidden", !visible);
    this.elements.editorSelectionLabel.textContent = selectionLabel;
  }

  touchControls(visible) {
    this.game.touchControls.setVisible(visible);
  }

  showToast(message, duration = 1600) {
    const toast = this.elements.toast;
    toast.textContent = message;
    toast.classList.remove("hidden");

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      toast.classList.add("hidden");
    }, duration);
  }

  flashGameOver() {
    this.elements.gameOverFlash.classList.remove("hidden");
    setTimeout(() => {
      this.elements.gameOverFlash.classList.add("hidden");
    }, 420);
  }

  renderLevelCards(catalog, progress) {
    const grid = this.elements.levelGrid;
    grid.innerHTML = "";

    const ordered = [...catalog].sort((first, second) => first.order - second.order);

    for (const level of ordered) {
      const unlocked = progress.unlockedLevels.includes(level.id);
      const completed = progress.completedLevels.includes(level.id);
      const best = progress.bestPercentByLevel[level.id] ?? 0;
      const card = document.createElement("article");
      card.className = `level-card ${unlocked ? "" : "locked"}`;
      card.innerHTML = `
        <h3>${level.name}</h3>
        <div class="difficulty-pill">${level.difficulty}</div>
        <p>${level.description}</p>
        <div class="level-stats">
          <span>Best ${Math.round(best * 100)}%</span>
          <span>${level.order + 1} jumps max</span>
          <span>${completed ? "Cleared" : unlocked ? "Unlocked" : "Locked"}</span>
        </div>
        <button ${unlocked ? "" : "disabled"}>${unlocked ? "Play" : "Locked"}</button>
      `;
      const button = card.querySelector("button");
      button?.addEventListener("click", () => {
        if (unlocked) {
          this.game.playLevel(level.id);
        }
      });
      grid.appendChild(card);
    }
  }
}
