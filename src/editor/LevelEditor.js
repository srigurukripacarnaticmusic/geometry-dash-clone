import { createEntityFromDefinition } from "../entities/createEntity.js";
import { snap } from "../utils/math.js";

export class LevelEditor {
  constructor(game) {
    this.game = game;
    this.enabled = false;
    this.selectionIndex = 0;
    this.selectionTypes = [
      { label: "Spike", build: (x, y) => ({ type: "spike", x, y, width: 1, height: 1, direction: "up" }) },
      { label: "Block", build: (x, y) => ({ type: "block", x, y, width: 1, height: 1 }) },
      { label: "Jump Pad", build: (x, y) => ({ type: "jumpPad", x, y: y + 0.75, width: 1, height: 0.25, power: 1.24 }) },
      { label: "Gravity Portal", build: (x, y) => ({ type: "portal", portalType: "gravity", x, y: y - 1, width: 1, height: 3, targetGravity: -1 }) },
      { label: "Speed Portal", build: (x, y) => ({ type: "portal", portalType: "speed", x, y: y - 1, width: 1, height: 3, speedMultiplier: 1.5 }) },
      { label: "Moving Platform", build: (x, y) => ({ type: "movingPlatform", x, y, width: 2, height: 0.5, axis: "y", distance: 2, speed: 60 }) },
      { label: "Checkpoint", build: (x, y) => ({ type: "checkpoint", x, y: y - 1, width: 0.4, height: 2 }) }
    ];
  }

  get currentSelection() {
    return this.selectionTypes[this.selectionIndex];
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.game.ui.setEditorVisible(enabled, this.currentSelection.label);
  }

  toggle() {
    this.setEnabled(!this.enabled);
  }

  setSelection(index) {
    const wrapped = Math.max(0, Math.min(this.selectionTypes.length - 1, index));
    this.selectionIndex = wrapped;
    this.game.ui.setEditorVisible(this.enabled, this.currentSelection.label);
  }

  update(playState) {
    const input = this.game.input;

    if (input.consume("editor")) {
      this.toggle();
    }

    if (!this.enabled) {
      return;
    }

    const selectionActions = [
      "editorType1",
      "editorType2",
      "editorType3",
      "editorType4",
      "editorType5",
      "editorType6",
      "editorType7"
    ];

    selectionActions.forEach((action, index) => {
      if (input.consume(action)) {
        this.setSelection(index);
      }
    });

    if (input.consume("pointerPrimary")) {
      this.placeAtPointer(playState);
    }

    if (input.consume("editorDelete")) {
      this.removeAtPointer(playState);
    }

    if (input.consume("editorExport")) {
      this.export(playState);
    }
  }

  getPointerTile(playState) {
    const screen = this.game.input.pointerWorld;
    const worldX = playState.camera.x + screen.x;
    const worldY = playState.camera.y + screen.y;
    const tileSize = playState.level.tileSize;
    const tileX = snap(worldX, tileSize) / tileSize;
    const tileY = snap(worldY, tileSize) / tileSize;
    return { tileX, tileY };
  }

  placeAtPointer(playState) {
    const { tileX, tileY } = this.getPointerTile(playState);
    const definition = this.currentSelection.build(tileX, tileY);
    playState.level.objects.push(definition);
    const entity = createEntityFromDefinition(playState.level, definition);

    if (entity) {
      playState.addEntity(entity);
      this.game.ui.showToast(`Placed ${this.currentSelection.label}`);
    }
  }

  removeAtPointer(playState) {
    const { tileX, tileY } = this.getPointerTile(playState);
    const tileSize = playState.level.tileSize;
    const worldX = tileX * tileSize;
    const worldY = tileY * tileSize;

    const hitIndex = playState.entities.findIndex((entity) => (
      entity.type !== "player" &&
      entity.x <= worldX + tileSize &&
      entity.x + entity.width >= worldX &&
      entity.y <= worldY + tileSize &&
      entity.y + entity.height >= worldY
    ));

    if (hitIndex === -1) {
      return;
    }

    const entity = playState.entities[hitIndex];
    playState.entities.splice(hitIndex, 1);
    const rawIndex = playState.level.objects.findIndex((objectDefinition) => {
      const candidate = createEntityFromDefinition(playState.level, objectDefinition);
      return candidate && candidate.type === entity.type && candidate.x === entity.x && candidate.y === entity.y;
    });

    if (rawIndex !== -1) {
      playState.level.objects.splice(rawIndex, 1);
    }

    this.game.ui.showToast(`Removed ${entity.type}`);
  }

  export(playState) {
    const tileSize = playState.level.tileSize;
    const exportData = playState.level.cloneData();
    exportData.objects = playState.entities
      .filter((entity) => entity.type !== "player")
      .map((entity) => entity.serialize?.(tileSize))
      .filter(Boolean)
      .sort((a, b) => a.x - b.x || a.y - b.y);

    const json = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(json)
      .then(() => this.game.ui.showToast("Level JSON copied to clipboard"))
      .catch(() => this.game.ui.showToast("Clipboard export failed"));
  }
}
