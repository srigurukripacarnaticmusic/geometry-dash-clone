import { BaseState } from "../core/BaseState.js";

export class GameOverState extends BaseState {
  constructor(game, playState) {
    super(game);
    this.kind = "gameOver";
    this.transparent = true;
    this.blocksUpdateBelow = true;
    this.playState = playState;
    this.timer = game.config.gameplay.restartDelay;
  }

  onEnter() {
    this.game.ui.flashGameOver();
  }

  update(dt) {
    this.timer -= dt;

    if (this.timer <= 0) {
      this.playState.restart();
      this.game.stateManager.popState();
    }
  }
}
