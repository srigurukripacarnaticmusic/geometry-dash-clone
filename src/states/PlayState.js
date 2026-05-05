import { BaseState } from "../core/BaseState.js";
import { Camera } from "../rendering/Camera.js";
import { Player } from "../entities/Player.js";
import { createEntityFromDefinition } from "../entities/createEntity.js";
import { ParticleSystem } from "../fx/ParticleSystem.js";
import { rectIntersectsSpike } from "../physics/Collision.js";
import { GameOverState } from "./GameOverState.js";
import { CompleteState } from "./CompleteState.js";
import { clamp } from "../utils/math.js";

export class PlayState extends BaseState {
  constructor(game, levelId) {
    super(game);
    this.kind = "play";
    this.levelId = levelId;
    this.level = null;
    this.camera = new Camera(game.config);
    this.player = null;
    this.entities = [];
    this.dynamicSolids = [];
    this.spikes = [];
    this.jumpPads = [];
    this.portals = [];
    this.checkpoints = [];
    this.particles = new ParticleSystem();
    this.attempt = 1;
    this.progress = 0;
    this.bestRunProgress = 0;
    this.loaded = false;
    this.loadingError = null;
    this.initialSpawn = null;
    this.activeCheckpoint = null;
    this.completing = false;
    this.beatPulse = 0;
    this.loadGeneration = 0;
    this.disposed = false;
  }

  async onEnter() {
    this.disposed = false;
    this.game.ui.clearScreens();
    this.game.ui.showLoading(true);
    this.game.ui.showHUD(false);
    this.game.ui.showPause(false);
    this.game.ui.hideComplete();
    this.game.ui.touchControls(this.game.saveManager.settings.touchControls);
    this.game.ui.setEditorVisible(false);
    await this.load();
  }

  async load() {
    const loadGeneration = ++this.loadGeneration;

    try {
      this.level = await this.game.levelLoader.loadLevel(this.levelId);

      if (this.disposed || loadGeneration !== this.loadGeneration || this.game.stateManager.current !== this) {
        return;
      }

      this.initialSpawn = {
        x: this.level.player.spawnX * this.level.tileSize,
        y: this.level.player.spawnY * this.level.tileSize
      };
      this.buildLevel();
      this.loaded = true;
      this.game.ui.showLoading(false);
      this.game.ui.showHUD(true);
      this.game.audio.startSong(this.level.songId);
    } catch (error) {
      if (this.disposed || loadGeneration !== this.loadGeneration) {
        return;
      }

      this.loadingError = error;
      console.error("Failed to load play state.", error);
      this.game.ui.showToast("Failed to load level");
      this.game.openMenu();
    }
  }

  onExit() {
    this.disposed = true;
    this.loadGeneration += 1;
    this.game.ui.showLoading(false);
    this.game.ui.setEditorVisible(false);
  }

  buildLevel(spawnOverride = null) {
    const spawn = spawnOverride ?? this.initialSpawn;
    this.entities = [];
    this.particles.clear();
    this.player = new Player(this.game.config, spawn);
    this.player.setBaseSpeed(this.level.baseSpeed);
    this.player.setJumpCount(this.game.saveManager.getEffectiveJumpCount(this.levelId));

    for (const definition of this.level.objects) {
      const entity = createEntityFromDefinition(this.level, definition);

      if (entity) {
        this.entities.push(entity);
      }
    }

    this.refreshEntityBuckets();
    this.camera.reset(Math.max(0, spawn.x - 240), 0);
  }

  refreshEntityBuckets() {
    this.dynamicSolids = this.entities.filter((entity) => entity.isSolid);
    this.spikes = this.entities.filter((entity) => entity.type === "spike");
    this.jumpPads = this.entities.filter((entity) => entity.type === "jumpPad");
    this.portals = this.entities.filter((entity) => entity.type === "gravityPortal" || entity.type === "speedPortal");
    this.checkpoints = this.entities.filter((entity) => entity.type === "checkpoint");
  }

  addEntity(entity) {
    this.entities.push(entity);
    this.refreshEntityBuckets();
  }

  applySettings() {
    this.player?.setJumpCount(this.game.saveManager.getEffectiveJumpCount(this.levelId));
  }

  restart() {
    this.game.audio.startSong(this.level.songId);
    this.game.ui.showPause(false);
    this.game.ui.hideComplete();
    this.game.ui.showHUD(true);
    this.game.ui.clearScreens();
    this.attempt += 1;
    const spawn = this.activeCheckpoint ?? this.initialSpawn;
    this.level = new this.level.constructor(this.level.cloneData());
    this.buildLevel(spawn);
    this.completing = false;
  }

  completeLevel() {
    if (this.completing) {
      return;
    }

    this.completing = true;
    this.bestRunProgress = 1;
    this.game.saveManager.setBestPercent(this.level.id, 1);
    this.game.saveManager.markComplete(this.level.id);
    const nextLevelId = this.game.levelLoader.getNextLevelId(this.level.id);

    if (nextLevelId) {
      this.game.saveManager.unlockLevel(nextLevelId);
    }

    this.game.audio.playComplete();
    this.game.stateManager.pushState(new CompleteState(this.game, {
      levelName: this.level.name,
      nextLevelId
    }));
  }

  handleDeath() {
    if (!this.loaded || this.completing || this.game.stateManager.current?.kind === "gameOver") {
      return;
    }

    this.bestRunProgress = Math.max(this.bestRunProgress, this.progress);
    this.game.saveManager.setBestPercent(this.level.id, this.bestRunProgress);
    this.player.alive = false;
    this.game.audio.playDeath();
    this.camera.addShake(26, 0.28);
    this.particles.spawnBurst(this.player.x + this.player.width * 0.5, this.player.y + this.player.height * 0.5, {
      count: 18,
      color: this.player.gravityDirection > 0 ? "#7bf7ff" : "#ff9fd4",
      speed: 260,
      life: 0.55
    });
    this.game.stateManager.pushState(new GameOverState(this.game, this));
  }

  update(dt) {
    if (!this.loaded || !this.player) {
      return;
    }

    this.beatPulse = this.game.audio.getBeatPulse();

    if (this.game.input.consume("pause")) {
      this.game.pauseCurrentLevel();
      return;
    }

    if (this.game.input.consume("restart")) {
      this.handleDeath();
      return;
    }

    this.game.editor.update(this);

    if (this.game.editor.enabled) {
      this.game.input.consume("jump");
    }

    for (const entity of this.entities) {
      entity.update?.(dt, this);
    }

    const jumpResult = this.player.update(dt, {
      input: this.game.input,
      physics: this.game.physics,
      level: this.level,
      dynamicSolids: this.dynamicSolids
    });

    if (jumpResult?.type === "jump") {
      this.game.audio.playJump();
      this.particles.spawnDirectionalBurst(
        this.player.x + this.player.width * 0.5,
        this.player.y + this.player.height * (this.player.gravityDirection > 0 ? 1 : 0),
        -1,
        -this.player.gravityDirection,
        {
          color: "#7bf7ff",
          count: 8,
          speed: 140
        }
      );
    } else if (jumpResult?.type === "airJump") {
      this.game.audio.playDoubleJump();
      const airJumpCount = jumpResult.jumpCount ?? 2;
      const burstColor = airJumpCount === 2
        ? "#ffe57a"
        : airJumpCount === 3
          ? "#ff9fd4"
          : "#89ffb0";
      this.particles.spawnBurst(this.player.x + this.player.width * 0.5, this.player.y + this.player.height * 0.5, {
        color: burstColor,
        count: 10 + airJumpCount * 2,
        speed: 150 + airJumpCount * 12,
        life: 0.28 + airJumpCount * 0.03
      });
    }

    for (const pad of this.jumpPads) {
      if (pad.tryTrigger(this.player)) {
        this.game.audio.playPad();
        this.particles.spawnDirectionalBurst(pad.x + pad.width * 0.5, pad.y, 0, -this.player.gravityDirection, {
          color: pad.color,
          count: 12,
          speed: 160
        });
      }
    }

    for (const portal of this.portals) {
      const result = portal.tryTrigger(this.player);

      if (result) {
        this.game.audio.playPortal();
        this.particles.spawnBurst(portal.x + portal.width * 0.5, portal.y + portal.height * 0.5, {
          color: portal.outerColor,
          count: 10,
          speed: 140,
          life: 0.4
        });
      }
    }

    for (const checkpoint of this.checkpoints) {
      if (checkpoint.tryTrigger(this.player)) {
        this.activeCheckpoint = {
          x: checkpoint.x,
          y: checkpoint.y
        };
        this.game.audio.playCheckpoint();
        this.game.ui.showToast("Checkpoint tagged");
      }
    }

    for (const spike of this.spikes) {
      if (rectIntersectsSpike(this.player.bounds, spike)) {
        this.handleDeath();
        return;
      }
    }

    if (this.player.hitWall) {
      this.handleDeath();
      return;
    }

    if (this.player.y > this.level.height * this.level.tileSize + 220 || this.player.y < -260) {
      this.handleDeath();
      return;
    }

    this.progress = clamp((this.player.x + this.player.width * 0.5) / this.level.finishX, 0, 1);
    this.bestRunProgress = Math.max(this.bestRunProgress, this.progress);

    if (this.player.x + this.player.width >= this.level.finishX) {
      this.completeLevel();
      return;
    }

    this.particles.update(dt);

    const targetCameraX = Math.max(0, this.player.x - this.game.config.camera.followOffsetX);
    const targetCameraY = Math.max(-80, this.player.y - this.game.config.canvas.height * 0.46 + this.game.config.camera.verticalLook * this.player.gravityDirection);
    this.camera.update(dt, targetCameraX, targetCameraY);

    this.game.ui.updateHUD({
      levelName: this.level.name,
      attempt: this.attempt,
      progress: this.progress,
      jumpModeLabel: this.game.saveManager.getJumpCountLabel(this.levelId),
      beat: this.beatPulse
    });
  }

  drawTiles(renderer) {
    const ctx = renderer.ctx;
    const tileSize = this.level.tileSize;
    const startTileX = Math.floor(this.camera.x / tileSize) - 2;
    const endTileX = startTileX + Math.ceil(renderer.width / tileSize) + 4;
    const startTileY = Math.floor(this.camera.y / tileSize) - 2;
    const endTileY = startTileY + Math.ceil(renderer.height / tileSize) + 5;

    for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
      for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
        if (!this.level.isSolidTile(tileX, tileY)) {
          continue;
        }

        const x = tileX * tileSize;
        const y = tileY * tileSize;
        renderer.drawGlowRect(x, y, tileSize, tileSize, this.level.colors.tile, 8);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.strokeRect(x, y, tileSize, tileSize);
      }
    }
  }

  drawFinishGate(renderer) {
    const ctx = renderer.ctx;
    const x = this.level.finishX;
    const totalHeight = this.level.height * this.level.tileSize;
    ctx.save();
    ctx.strokeStyle = "#89ffb0";
    ctx.lineWidth = 8;
    ctx.shadowColor = "#89ffb0";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, totalHeight);
    ctx.stroke();
    ctx.restore();
  }

  render(renderer) {
    if (this.loadingError) {
      renderer.drawBackground({
        colors: {
          skyTop: "#2a0f22",
          skyBottom: "#160814",
          glow: "#ff6e96",
          accent: "#ffe57a"
        },
        beat: 0,
        cameraX: 0
      });
      return;
    }

    const colors = this.level?.colors ?? {
      skyTop: "#102744",
      skyBottom: "#06101c",
      glow: "#7bf7ff",
      accent: "#ffe57a"
    };

    renderer.drawBackground({
      colors,
      beat: this.beatPulse,
      cameraX: this.camera.x
    });

    if (!this.loaded) {
      return;
    }

    renderer.withCamera(this.camera, () => {
      if (this.game.editor.enabled) {
        renderer.drawGrid(this.camera.x, this.camera.y, this.level.tileSize);
      }

      this.drawTiles(renderer);

      for (const entity of this.entities) {
        entity.draw(renderer);
      }

      this.drawFinishGate(renderer);
      this.player.draw(renderer);
      this.particles.draw(renderer);
    });
  }
}
