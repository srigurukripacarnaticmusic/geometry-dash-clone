import { Entity } from "./Entity.js";

export class Spike extends Entity {
  constructor(definition) {
    super({
      x: definition.x,
      y: definition.y,
      width: definition.width,
      height: definition.height,
      type: "spike"
    });
    this.direction = definition.direction ?? "up";
    this.color = definition.color ?? "#ff6e96";
  }

  draw(renderer) {
    renderer.drawSpike(this.x, this.y, this.width, this.height, this.color, this.direction);
  }

  serialize(tileSize) {
    return {
      type: "spike",
      x: this.x / tileSize,
      y: this.y / tileSize,
      width: this.width / tileSize,
      height: this.height / tileSize,
      direction: this.direction,
      color: this.color
    };
  }
}
