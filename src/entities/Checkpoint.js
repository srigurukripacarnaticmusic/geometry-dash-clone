import { Entity } from "./Entity.js";
import { aabbIntersects } from "../physics/Collision.js";

export class Checkpoint extends Entity {
  constructor(definition) {
    super({
      x: definition.x,
      y: definition.y,
      width: definition.width,
      height: definition.height,
      type: "checkpoint"
    });

    this.activated = false;
    this.color = definition.color ?? "#ffe57a";
  }

  tryTrigger(player) {
    if (this.activated || !aabbIntersects(this.bounds, player.bounds)) {
      return false;
    }

    this.activated = true;
    return true;
  }

  reset() {
    this.activated = false;
  }

  draw(renderer) {
    const color = this.activated ? "#89ffb0" : this.color;
    renderer.drawGlowRect(this.x, this.y, this.width, this.height, color, 16);
  }

  serialize(tileSize) {
    return {
      type: "checkpoint",
      x: this.x / tileSize,
      y: this.y / tileSize,
      width: this.width / tileSize,
      height: this.height / tileSize,
      color: this.color
    };
  }
}
