export class BaseState {
  constructor(game) {
    this.game = game;
    this.transparent = false;
    this.blocksUpdateBelow = true;
  }

  onEnter() {}

  onExit() {}

  onPause() {}

  onResume() {}

  update() {}

  render() {}
}
