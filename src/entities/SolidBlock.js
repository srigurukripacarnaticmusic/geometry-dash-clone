import { Entity } from "./Entity.js";

export class SolidBlock extends Entity {
  constructor(definition) {
    super({
      x: definition.x,
      y: definition.y,
      width: definition.width,
      height: definition.height,
      type: "block"
    });

    this.isSolid = true;
    this.color = definition.color ?? "#2d4d73";
    this.outline = definition.outline ?? "#8ddcf8";
  }

  draw(renderer) {
    renderer.drawGlowRect(this.x, this.y, this.width, this.height, this.color, 10);
    renderer.drawRoundedRect(this.x, this.y, this.width, this.height, 4, null, this.outline);
  }

  serialize(tileSize) {
    return {
      type: "block",
      x: this.x / tileSize,
      y: this.y / tileSize,
      width: this.width / tileSize,
      height: this.height / tileSize,
      color: this.color,
      outline: this.outline
    };
  }
}
