import { Entity } from "./Entity.js";
import { aabbIntersects } from "../physics/Collision.js";

export class Portal extends Entity {
  constructor(definition) {
    super({
      x: definition.x,
      y: definition.y,
      width: definition.width,
      height: definition.height,
      type: definition.portalType === "speed" ? "speedPortal" : "gravityPortal"
    });

    this.portalType = definition.portalType ?? "gravity";
    this.targetGravity = definition.targetGravity ?? -1;
    this.speedMultiplier = definition.speedMultiplier ?? 1.4;
    this.cooldown = 0;
    this.outerColor = this.portalType === "gravity" ? "#7bf7ff" : "#89ffb0";
    this.innerColor = this.portalType === "gravity" ? "#a5c6ff" : "#d4ff9c";
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
  }

  tryTrigger(player) {
    if (this.cooldown > 0) {
      return null;
    }

    if (!aabbIntersects(this.bounds, player.bounds)) {
      return null;
    }

    this.cooldown = 0.25;

    if (this.portalType === "gravity") {
      const desired = this.targetGravity >= 0 ? 1 : -1;

      if (player.gravityDirection !== desired) {
        player.flipGravity();
      }

      return { type: "gravity", value: desired };
    }

    player.targetSpeed = player.baseSpeed * this.speedMultiplier;
    return { type: "speed", value: player.targetSpeed };
  }

  draw(renderer) {
    renderer.drawPortal(this.x, this.y, this.width, this.height, this.outerColor, this.innerColor);
  }

  serialize(tileSize) {
    return {
      type: "portal",
      portalType: this.portalType,
      x: this.x / tileSize,
      y: this.y / tileSize,
      width: this.width / tileSize,
      height: this.height / tileSize,
      targetGravity: this.targetGravity,
      speedMultiplier: this.speedMultiplier
    };
  }
}
