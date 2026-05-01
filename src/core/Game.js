import { EventBus } from "./EventBus.js";
import { GameLoop } from "./GameLoop.js";
import { StateManager } from "./StateManager.js";
import { SaveManager } from "./SaveManager.js";
import { Renderer } from "../rendering/Renderer.js";
import { InputSystem } from "../input/InputSystem.js";
import { TouchControls } from "../input/TouchControls.js";
import { AudioSystem } from "../audio/AudioSystem.js";
import { LevelLoader } from "../level/LevelLoader.js";
import { PhysicsSystem } from "../physics/PhysicsSystem.js";
import { MenuUI } from "../ui/MenuUI.js";
import { MenuState } from "../states/MenuState.js";
import { LevelSelectState } from "../states/LevelSelectState.js";
import { PlayState } from "../states/PlayState.js";
import { PauseState } from "../states/PauseState.js";
import { LevelEditor } from "../editor/LevelEditor.js";

export class Game {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.eventBus = new EventBus();
    this.saveManager = new SaveManager();
    this.renderer = new Renderer(canvas, config);
    this.input = new InputSystem(canvas);
    this.touchControls = new TouchControls(this.input, document.getElementById("touchControls"));
    this.audio = new AudioSystem(config, this.eventBus);
    this.levelLoader = new LevelLoader();
    this.physics = new PhysicsSystem(config);
    this.stateManager = new StateManager(this);
    this.ui = new MenuUI(this);
    this.editor = new LevelEditor(this);
    this.loop = new GameLoop({
      fixedDelta: config.loop.fixedDelta,
      maxFrameDelta: config.loop.maxFrameDelta,
      update: (dt) => this.update(dt),
      render: (alpha) => this.render(alpha)
    });

    this.boundUnlockAudio = this.unlockAudio.bind(this);
  }

  async init() {
    this.audio.setMasterVolume(this.saveManager.settings.masterVolume);
    this.touchControls.setVisible(this.saveManager.settings.touchControls);
    window.addEventListener("pointerdown", this.boundUnlockAudio);
    window.addEventListener("keydown", this.boundUnlockAudio);
    this.openMenu();
  }

  start() {
    this.loop.start();
  }

  async unlockAudio() {
    await this.audio.unlock();

    if (this.audio.unlocked) {
      window.removeEventListener("pointerdown", this.boundUnlockAudio);
      window.removeEventListener("keydown", this.boundUnlockAudio);
    }
  }

  update(dt) {
    this.audio.update();
    this.stateManager.update(dt);
    this.input.endFrame();
  }

  render(alpha) {
    this.renderer.beginFrame();
    this.stateManager.render(this.renderer, alpha);
  }

  getActivePlayState() {
    for (let index = this.stateManager.stack.length - 1; index >= 0; index -= 1) {
      const state = this.stateManager.stack[index];

      if (state.kind === "play") {
        return state;
      }
    }

    return null;
  }

  applySettingsToActivePlayState() {
    this.ui.syncSettings();
    this.touchControls.setVisible(this.saveManager.settings.touchControls && this.getActivePlayState() !== null);
    this.audio.setMasterVolume(this.saveManager.settings.masterVolume);
    this.getActivePlayState()?.applySettings();
  }

  openMenu() {
    this.stateManager.setState(new MenuState(this));
  }

  openLevelSelect() {
    this.stateManager.setState(new LevelSelectState(this));
  }

  playLevel(levelId) {
    if (!levelId) {
      return;
    }

    this.stateManager.setState(new PlayState(this, levelId));
  }

  pauseCurrentLevel() {
    if (this.stateManager.current?.kind === "play") {
      this.stateManager.pushState(new PauseState(this));
      this.touchControls.setVisible(false);
    }
  }

  resumeCurrentPause() {
    if (this.stateManager.current?.kind === "pause") {
      this.stateManager.popState();
      this.touchControls.setVisible(this.saveManager.settings.touchControls && this.getActivePlayState() !== null);
    }
  }

  restartCurrentLevel() {
    if (this.stateManager.current?.kind === "pause") {
      this.stateManager.popState();
    }

    const playState = this.getActivePlayState();

    if (playState) {
      playState.handleDeath();
    }

    this.touchControls.setVisible(this.saveManager.settings.touchControls && playState !== null);
  }

  exitToMenu() {
    this.audio.stopSong();
    this.touchControls.setVisible(false);
    this.openMenu();
  }
}
