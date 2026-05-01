export class Level {
  constructor(data) {
    this.raw = data;
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.width = data.width;
    this.height = data.height;
    this.tileSize = data.tileSize;
    this.baseSpeed = data.baseSpeed;
    this.finishX = data.finishX * this.tileSize;
    this.songId = data.songId;
    this.player = data.player;
    this.colors = data.colors;
    this.tiles = data.tiles;
    this.objects = data.objects ?? [];
    this.layers = data.layers ?? {};
    this.meta = data.meta ?? {};
  }

  cloneData() {
    return structuredClone(this.raw);
  }

  tileToWorld(tileX, tileY) {
    return {
      x: tileX * this.tileSize,
      y: tileY * this.tileSize
    };
  }

  worldToTile(x, y) {
    return {
      x: Math.floor(x / this.tileSize),
      y: Math.floor(y / this.tileSize)
    };
  }

  getTile(tileX, tileY) {
    if (tileY < 0 || tileY >= this.tiles.solids.length) {
      return ".";
    }

    const row = this.tiles.solids[tileY];

    if (!row || tileX < 0 || tileX >= row.length) {
      return ".";
    }

    return row[tileX];
  }

  isSolidTile(tileX, tileY) {
    return this.getTile(tileX, tileY) === "#";
  }

  getSolidRectsForRegion(minX, minY, maxX, maxY) {
    const tileMinX = Math.floor(minX / this.tileSize);
    const tileMaxX = Math.floor(maxX / this.tileSize);
    const tileMinY = Math.floor(minY / this.tileSize);
    const tileMaxY = Math.floor(maxY / this.tileSize);
    const rects = [];

    for (let tileY = tileMinY; tileY <= tileMaxY; tileY += 1) {
      for (let tileX = tileMinX; tileX <= tileMaxX; tileX += 1) {
        if (!this.isSolidTile(tileX, tileY)) {
          continue;
        }

        rects.push({
          x: tileX * this.tileSize,
          y: tileY * this.tileSize,
          width: this.tileSize,
          height: this.tileSize,
          type: "tile"
        });
      }
    }

    return rects;
  }
}
