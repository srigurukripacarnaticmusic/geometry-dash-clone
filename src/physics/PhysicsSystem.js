import { aabbIntersects } from "./Collision.js";

export class PhysicsSystem {
  constructor(config) {
    this.config = config;
  }

  getNearbySolids(level, actor, dynamicSolids = []) {
    const region = level.getSolidRectsForRegion(
      actor.x - 4,
      actor.y - 4,
      actor.x + actor.width + 4,
      actor.y + actor.height + 4
    );

    for (const entity of dynamicSolids) {
      if (!entity.active || !entity.isSolid) {
        continue;
      }

      if (
        entity.x < actor.x + actor.width + 128 &&
        entity.x + entity.width > actor.x - 128 &&
        entity.y < actor.y + actor.height + 128 &&
        entity.y + entity.height > actor.y - 128
      ) {
        region.push(entity);
      }
    }

    return region;
  }

  moveActor(actor, level, dynamicSolids, dt) {
    actor.grounded = false;
    actor.hitCeiling = false;
    actor.hitWall = false;
    actor.groundEntity = null;

    if (actor.carriedBy && actor.carriedBy.active) {
      actor.x += actor.carriedBy.deltaX;
      actor.y += actor.carriedBy.deltaY;
    }

    actor.carriedBy = null;

    let moveX = actor.vx * dt;
    actor.x += moveX;
    let solids = this.getNearbySolids(level, actor, dynamicSolids);

    for (const solid of solids) {
      if (!aabbIntersects(actor.bounds, solid.bounds ?? solid)) {
        continue;
      }

      if (moveX > 0) {
        actor.x = (solid.x ?? solid.bounds.x) - actor.width;
      } else if (moveX < 0) {
        actor.x = (solid.x ?? solid.bounds.x) + (solid.width ?? solid.bounds.width);
      }

      actor.vx = 0;
      actor.hitWall = true;
      moveX = 0;
    }

    let moveY = actor.vy * dt;
    actor.y += moveY;
    solids = this.getNearbySolids(level, actor, dynamicSolids);

    for (const solid of solids) {
      const box = solid.bounds ?? solid;

      if (!aabbIntersects(actor.bounds, box)) {
        continue;
      }

      if (moveY > 0) {
        actor.y = box.y - actor.height;
        actor.grounded = actor.gravityDirection > 0;
        actor.hitCeiling = actor.gravityDirection < 0;
        actor.groundEntity = solid.isSolid ? solid : null;
      } else if (moveY < 0) {
        actor.y = box.y + box.height;
        actor.grounded = actor.gravityDirection < 0;
        actor.hitCeiling = actor.gravityDirection > 0;
        actor.groundEntity = solid.isSolid ? solid : null;
      }

      actor.vy = 0;
      moveY = 0;
    }

    if (actor.grounded && actor.groundEntity?.isSolid) {
      actor.carriedBy = actor.groundEntity;
    }
  }
}
