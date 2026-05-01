import { Spike } from "./Spike.js";
import { JumpPad } from "./JumpPad.js";
import { Portal } from "./Portal.js";
import { MovingPlatform } from "./MovingPlatform.js";
import { Checkpoint } from "./Checkpoint.js";
import { SolidBlock } from "./SolidBlock.js";

function worldize(level, definition) {
  const tileSize = level.tileSize;
  return {
    ...definition,
    x: definition.x * tileSize,
    y: definition.y * tileSize,
    width: (definition.width ?? 1) * tileSize,
    height: (definition.height ?? 1) * tileSize,
    distance: (definition.distance ?? 0) * tileSize
  };
}

export function createEntityFromDefinition(level, definition) {
  const data = worldize(level, definition);

  switch (definition.type) {
    case "spike":
      return new Spike(data);
    case "jumpPad":
      return new JumpPad(data);
    case "portal":
      return new Portal(data);
    case "movingPlatform":
      return new MovingPlatform(data);
    case "checkpoint":
      return new Checkpoint(data);
    case "block":
      return new SolidBlock(data);
    default:
      return null;
  }
}
