import { Entity } from "./Entity.js";
import { pingPong } from "../utils/math.js";

export class MovingPlatform extends Entity {
  constructor(definition) {
    super({
      x: definition.x,
      y: definition.y,
      width: definition.width,
      height: definition.height,
      type: "movingPlatform"
    });

    this.startX = definition.x;
    this.startY = definition.y;
    this.axis = definition.axis ?? "x";
    this.distance = definition.distance ?? 120;
    this.speed = definition.speed ?? 90;
    this.time = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.color = definition.color ?? "#9fe0ff";
    this.isSolid = true;
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.time = 0;
    this.deltaX = 0;
    this.deltaY = 0;
  }

  update(dt) {
    const previousX = this.x;
    const previousY = this.y;

    this.time += dt * this.speed;
    const offset = pingPong(this.time, this.distance);

    if (this.axis === "x") {
      this.x = this.startX + offset;
      this.y = this.startY;
    } else {
      this.y = this.startY + offset;
      this.x = this.startX;
    }

    this.deltaX = this.x - previousX;
    this.deltaY = this.y - previousY;
  }

  draw(renderer) {
    renderer.drawGlowRect(this.x, this.y, this.width, this.height, this.color, 18);
  }

  serialize(tileSize) {
    return {
      type: "movingPlatform",
      x: this.startX / tileSize,
      y: this.startY / tileSize,
      width: this.width / tileSize,
      height: this.height / tileSize,
      axis: this.axis,
      distance: this.distance / tileSize,
      speed: this.speed,
      color: this.color
    };
  }
}
