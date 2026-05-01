export class GameLoop {
  constructor({ fixedDelta, maxFrameDelta, update, render }) {
    this.fixedDelta = fixedDelta;
    this.maxFrameDelta = maxFrameDelta;
    this.updateCallback = update;
    this.renderCallback = render;
    this.running = false;
    this.accumulator = 0;
    this.lastTimestamp = 0;
    this.boundFrame = this.frame.bind(this);
  }

  start() {
    if (this.running) {
      return;
    }

    this.running = true;
    this.accumulator = 0;
    this.lastTimestamp = performance.now();
    requestAnimationFrame(this.boundFrame);
  }

  stop() {
    this.running = false;
  }

  frame(timestamp) {
    if (!this.running) {
      return;
    }

    let frameDelta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    frameDelta = Math.min(frameDelta, this.maxFrameDelta);
    this.accumulator += frameDelta;

    while (this.accumulator >= this.fixedDelta) {
      this.updateCallback(this.fixedDelta);
      this.accumulator -= this.fixedDelta;
    }

    const alpha = this.accumulator / this.fixedDelta;
    this.renderCallback(alpha);

    requestAnimationFrame(this.boundFrame);
  }
}
