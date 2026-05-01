import { BaseState } from "../core/BaseState.js";

export class PauseState extends BaseState {
  constructor(game) {
    super(game);
    this.kind = "pause";
    this.transparent = true;
    this.blocksUpdateBelow = true;
  }

  onEnter() {
    this.game.ui.showPause(true);
  }

  onExit() {
    this.game.ui.showPause(false);
  }

  update() {
    if (this.game.input.consume("pause")) {
      this.game.resumeCurrentPause();
    }
  }
}
