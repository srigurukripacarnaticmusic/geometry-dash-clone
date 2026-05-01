import { BaseState } from "../core/BaseState.js";

export class CompleteState extends BaseState {
  constructor(game, payload) {
    super(game);
    this.kind = "complete";
    this.transparent = true;
    this.blocksUpdateBelow = true;
    this.payload = payload;
  }

  onEnter() {
    this.game.ui.showComplete(this.payload);
  }

  onExit() {
    this.game.ui.hideComplete();
  }
}
