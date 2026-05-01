import { clamp, damp, randRange } from "../utils/math.js";

export class Camera {
  constructor(config) {
    this.config = config;
    this.x = 0;
    this.y = 0;
    this.shakeTime = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  reset(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.shakeTime = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  addShake(intensity, duration = 0.24) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  update(dt, targetX, targetY) {
    this.x = damp(this.x, targetX, 10, dt);
    this.y = damp(this.y, targetY, 10, dt);

    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
      const normalized = this.shakeDuration <= 0 ? 0 : this.shakeTime / this.shakeDuration;
      const amplitude = this.shakeIntensity * normalized;
      this.shakeOffsetX = randRange(-amplitude, amplitude);
      this.shakeOffsetY = randRange(-amplitude, amplitude);

      if (this.shakeTime === 0) {
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
      }
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    this.y = clamp(this.y, -2000, 2000);
  }

  applyToContext(ctx) {
    ctx.translate(Math.round(-this.x + this.shakeOffsetX), Math.round(-this.y + this.shakeOffsetY));
  }
}
