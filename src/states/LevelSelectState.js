import { BaseState } from "../core/BaseState.js";

export class LevelSelectState extends BaseState {
  constructor(game) {
    super(game);
    this.kind = "levelSelect";
    this.time = 0;
  }

  onEnter() {
    this.game.audio.stopSong();
    this.game.ui.hideComplete();
    this.game.ui.showPause(false);
    this.game.ui.showLoading(false);
    this.game.ui.showLevelSelect(this.game.levelLoader.getCatalog(), this.game.saveManager.progress);
  }

  update(dt) {
    this.time += dt;
  }

  render(renderer) {
    renderer.drawBackground({
      colors: {
        skyTop: "#0b2440",
        skyBottom: "#060d18",
        glow: "#89ffb0",
        accent: "#7bf7ff"
      },
      beat: (Math.sin(this.time * 2) + 1) * 0.16,
      cameraX: this.time * 32
    });
  }
}
