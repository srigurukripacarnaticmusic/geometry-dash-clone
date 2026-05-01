let ENTITY_ID = 1;

export class Entity {
  constructor({
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    type = "entity"
  } = {}) {
    this.id = ENTITY_ID += 1;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.active = true;
    this.isSolid = false;
  }

  get bounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  update() {}

  draw() {}

  reset() {}
}
