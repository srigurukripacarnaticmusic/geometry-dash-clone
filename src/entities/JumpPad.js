import { Entity } from "./Entity.js";
import { aabbIntersects } from "../physics/Collision.js";

export class JumpPad extends Entity {
  constructor(definition) {
    super({
      x: definition.x,
      y: definition.y,
      width: definition.width,
      height: definition.height,
      type: "jumpPad"
    });

    this.power = definition.power ?? 1.2;
    this.color = definition.color ?? "#ffe57a";
    this.cooldown = 0;
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
  }

  tryTrigger(player) {
    if (this.cooldown > 0) {
      return false;
    }

    const triggerBounds = {
      x: this.x,
      y: this.y - 4,
      width: this.width,
      height: this.height + 8
    };

    if (!aabbIntersects(triggerBounds, player.bounds)) {
      return false;
    }

    const correctDirection = player.gravityDirection > 0
      ? player.vy >= 0 && player.y + player.height <= this.y + this.height + 10
      : player.vy <= 0 && player.y >= this.y - 10;

    if (!correctDirection) {
      return false;
    }

    this.cooldown = 0.14;
    player.bounce(this.power);
    return true;
  }

  draw(renderer) {
    renderer.drawPad(this.x, this.y, this.width, this.height, this.color);
  }

  serialize(tileSize) {
    return {
      type: "jumpPad",
      x: this.x / tileSize,
      y: this.y / tileSize,
      width: this.width / tileSize,
      height: this.height / tileSize,
      power: this.power,
      color: this.color
    };
  }
}
