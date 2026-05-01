import { blend, withAlpha } from "../utils/color.js";
import { clamp, inverseLerp } from "../utils/math.js";

export class BackgroundRenderer {
  constructor(config) {
    this.config = config;
    this.starSeed = Array.from({ length: 96 }, (_, index) => ({
      x: ((index * 113) % 997) / 997,
      y: ((index * 181) % 991) / 991,
      size: 1 + ((index * 17) % 3),
      speed: 0.1 + (((index * 29) % 100) / 100) * 0.7
    }));
  }

  draw(renderer, scene) {
    const { ctx, width, height } = renderer;
    const palette = scene?.colors ?? {
      skyTop: "#102744",
      skyBottom: "#05101d",
      glow: "#7bf7ff",
      accent: "#ffe57a"
    };
    const beat = scene?.beat ?? 0;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, palette.skyTop);
    gradient.addColorStop(1, palette.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const glowGradient = ctx.createRadialGradient(width * 0.5, height * 0.26, 20, width * 0.5, height * 0.26, 280);
    glowGradient.addColorStop(0, withAlpha(palette.glow, 0.26 + beat * 0.18));
    glowGradient.addColorStop(1, withAlpha(palette.glow, 0));
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.26, 280, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    for (const star of this.starSeed) {
      const x = (star.x * width - (scene?.cameraX ?? 0) * star.speed * 0.1) % width;
      const y = star.y * height * 0.72;
      ctx.fillStyle = withAlpha("#ffffff", 0.18 + beat * 0.12);
      ctx.fillRect((x + width) % width, y, star.size, star.size);
    }

    this.drawMountains(ctx, width, height, palette.skyBottom, scene?.cameraX ?? 0, 0.18, 0.62, 72);
    this.drawMountains(ctx, width, height, blend(palette.skyBottom, palette.glow, 0.18), scene?.cameraX ?? 0, 0.3, 0.74, 102);
    this.drawGroundGrid(ctx, width, height, palette, beat, scene?.cameraX ?? 0);
  }

  drawMountains(ctx, width, height, color, cameraX, speed, horizon, amplitude) {
    ctx.fillStyle = withAlpha(color, 0.42);
    ctx.beginPath();
    ctx.moveTo(0, height);

    const segments = 10;
    for (let index = 0; index <= segments; index += 1) {
      const t = index / segments;
      const x = t * width;
      const wave = Math.sin((t * 4.3 + cameraX * 0.0025 * speed) * Math.PI * 2);
      const y = height * horizon - Math.abs(wave) * amplitude;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  }

  drawGroundGrid(ctx, width, height, palette, beat, cameraX) {
    const horizonY = height * 0.73;
    ctx.strokeStyle = withAlpha(palette.glow, 0.18);
    ctx.lineWidth = 1;

    for (let row = 0; row < 16; row += 1) {
      const y = horizonY + Math.pow(row / 15, 1.8) * height * 0.45;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const perspective = 16;
    for (let column = -perspective; column <= perspective; column += 1) {
      const x = width * 0.5 + (column * width) / 15 - (cameraX * 0.4) % (width / 7.5);
      ctx.beginPath();
      ctx.moveTo(width * 0.5, horizonY);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    const floorGlow = ctx.createLinearGradient(0, horizonY, 0, height);
    floorGlow.addColorStop(0, withAlpha(palette.accent, 0.02));
    floorGlow.addColorStop(1, withAlpha(palette.glow, 0.12 + beat * 0.07));
    ctx.fillStyle = floorGlow;
    ctx.fillRect(0, horizonY, width, height - horizonY);

    const pulseHeight = inverseLerp(0, 1, clamp(beat, 0, 1));
    ctx.fillStyle = withAlpha(palette.glow, 0.05 + pulseHeight * 0.05);
    ctx.fillRect(0, horizonY - 8, width, 10);
  }
}
