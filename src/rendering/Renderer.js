import { BackgroundRenderer } from "./BackgroundRenderer.js";
import { withAlpha } from "../utils/color.js";

export class Renderer {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.config = config;
    this.width = config.canvas.width;
    this.height = config.canvas.height;
    this.pixelRatio = 1;
    this.background = new BackgroundRenderer(config);
    this.resizeObserver = null;

    this.handleResize = this.handleResize.bind(this);
    this.handleResize();
    window.addEventListener("resize", this.handleResize);
  }

  handleResize() {
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, this.config.canvas.maxPixelRatio);
    this.pixelRatio = devicePixelRatio;
    this.canvas.width = Math.floor(this.width * devicePixelRatio);
    this.canvas.height = Math.floor(this.height * devicePixelRatio);
    this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
  }

  beginFrame() {
    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawBackground(scene) {
    this.background.draw(this, scene);
  }

  withCamera(camera, callback) {
    this.ctx.save();
    camera.applyToContext(this.ctx);
    callback(this.ctx);
    this.ctx.restore();
  }

  drawGrid(cameraX, cameraY, tileSize, color = "rgba(255,255,255,0.08)") {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const startX = Math.floor(cameraX / tileSize) * tileSize - tileSize * 2;
    const endX = startX + this.width + tileSize * 4;
    const startY = Math.floor(cameraY / tileSize) * tileSize - tileSize * 2;
    const endY = startY + this.height + tileSize * 4;

    for (let x = startX; x <= endX; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawRect(x, y, width, height, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }

  drawGlowRect(x, y, width, height, color, glow = 18) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }

  drawRoundedRect(x, y, width, height, radius, fillStyle, strokeStyle = null) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();

    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }

    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.stroke();
    }
  }

  drawSpike(x, y, width, height, color, direction = "up") {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.beginPath();

    if (direction === "up") {
      ctx.moveTo(x, y + height);
      ctx.lineTo(x + width * 0.5, y);
      ctx.lineTo(x + width, y + height);
    } else if (direction === "down") {
      ctx.moveTo(x, y);
      ctx.lineTo(x + width * 0.5, y + height);
      ctx.lineTo(x + width, y);
    } else if (direction === "left") {
      ctx.moveTo(x + width, y);
      ctx.lineTo(x, y + height * 0.5);
      ctx.lineTo(x + width, y + height);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y + height * 0.5);
      ctx.lineTo(x, y + height);
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawPortal(x, y, width, height, outerColor, innerColor) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = outerColor;
    ctx.lineWidth = 6;
    ctx.shadowColor = outerColor;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.ellipse(x + width * 0.5, y + height * 0.5, width * 0.38, height * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = withAlpha(innerColor, 0.2);
    ctx.fill();

    ctx.strokeStyle = withAlpha("#ffffff", 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + width * 0.5, y + height * 0.5, width * 0.24, height * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawPad(x, y, width, height, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, withAlpha(color, 0.95));
    gradient.addColorStop(1, withAlpha(color, 0.32));
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = withAlpha("#ffffff", 0.35);
    ctx.fillRect(x + 4, y + 4, width - 8, 4);
    ctx.restore();
  }

  drawRing(x, y, radius, lineWidth, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawLabel(text, x, y, color = "#ffffff", font = "600 16px Segoe UI") {
    this.ctx.save();
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }
}
