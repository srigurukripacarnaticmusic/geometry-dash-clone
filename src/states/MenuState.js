import { BaseState } from "../core/BaseState.js";

export class MenuState extends BaseState {
  constructor(game) {
    super(game);
    this.kind = "menu";
    this.time = 0;
  }

  onEnter() {
    this.game.audio.stopSong();
    this.game.ui.hideComplete();
    this.game.ui.showPause(false);
    this.game.ui.showLoading(false);
    this.game.ui.showMenu();
    this.game.ui.syncSettings();
  }

  update(dt) {
    this.time += dt;
  }

  render(renderer) {
    renderer.drawBackground({
      colors: {
        skyTop: "#102744",
        skyBottom: "#06101c",
        glow: "#7bf7ff",
        accent: "#ffe57a"
      },
      beat: (Math.sin(this.time * 2.8) + 1) * 0.18,
      cameraX: this.time * 40
    });
  }
}
