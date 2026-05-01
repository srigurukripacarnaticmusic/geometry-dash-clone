export class StateManager {
  constructor(game) {
    this.game = game;
    this.stack = [];
  }

  get current() {
    return this.stack[this.stack.length - 1] ?? null;
  }

  setState(state) {
    while (this.stack.length > 0) {
      const existing = this.stack.pop();
      existing?.onExit?.();
    }

    this.stack.push(state);
    state.onEnter?.();
  }

  pushState(state) {
    this.current?.onPause?.();
    this.stack.push(state);
    state.onEnter?.();
  }

  popState() {
    const popped = this.stack.pop();
    popped?.onExit?.();
    this.current?.onResume?.();
    return popped;
  }

  update(dt) {
    if (this.stack.length === 0) {
      return;
    }

    let firstUpdatedIndex = this.stack.length - 1;

    for (let index = this.stack.length - 1; index >= 0; index -= 1) {
      firstUpdatedIndex = index;

      if (this.stack[index].blocksUpdateBelow !== false) {
        break;
      }
    }

    for (let index = firstUpdatedIndex; index < this.stack.length; index += 1) {
      this.stack[index].update?.(dt);
    }
  }

  render(renderer, alpha) {
    if (this.stack.length === 0) {
      return;
    }

    let firstVisibleIndex = this.stack.length - 1;

    for (let index = this.stack.length - 1; index >= 0; index -= 1) {
      firstVisibleIndex = index;

      if (this.stack[index].transparent !== true) {
        break;
      }
    }

    for (let index = firstVisibleIndex; index < this.stack.length; index += 1) {
      this.stack[index].render?.(renderer, alpha);
    }
  }
}
