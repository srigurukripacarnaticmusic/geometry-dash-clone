import { withAlpha } from "../utils/color.js";
import { randRange } from "../utils/math.js";

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  clear() {
    this.particles = [];
  }

  spawnBurst(x, y, options = {}) {
    const {
      count = 12,
      color = "#7bf7ff",
      speed = 220,
      spread = Math.PI,
      size = 8,
      life = 0.45
    } = options;

    for (let index = 0; index < count; index += 1) {
      const angle = randRange(-spread * 0.5, spread * 0.5);
      const magnitude = randRange(speed * 0.35, speed);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * magnitude,
        vy: Math.sin(angle) * magnitude,
        size: randRange(size * 0.5, size),
        color,
        life,
        maxLife: life,
        gravity: randRange(240, 720)
      });
    }
  }

  spawnDirectionalBurst(x, y, directionX, directionY, options = {}) {
    const {
      count = 10,
      color = "#ffe57a",
      speed = 180,
      spread = 0.9,
      size = 6,
      life = 0.35
    } = options;

    const baseAngle = Math.atan2(directionY, directionX);

    for (let index = 0; index < count; index += 1) {
      const angle = baseAngle + randRange(-spread * 0.5, spread * 0.5);
      const magnitude = randRange(speed * 0.3, speed);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * magnitude,
        vy: Math.sin(angle) * magnitude,
        size: randRange(size * 0.4, size),
        color,
        life,
        maxLife: life,
        gravity: randRange(160, 520)
      });
    }
  }

  update(dt) {
    for (const particle of this.particles) {
      particle.vy += particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
    }

    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  draw(renderer) {
    const { ctx } = renderer;

    for (const particle of this.particles) {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.fillStyle = withAlpha(particle.color, alpha);
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 14;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      ctx.restore();
    }
  }
}
