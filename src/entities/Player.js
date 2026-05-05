import { Entity } from "./Entity.js";
import { clamp } from "../utils/math.js";

export class Player extends Entity {
  constructor(config, spawnPoint) {
    super({
      x: spawnPoint.x,
      y: spawnPoint.y,
      width: config.player.width,
      height: config.player.height,
      type: "player"
    });

    this.config = config;
    this.spawnPoint = { ...spawnPoint };
    this.baseSpeed = config.physics.defaultGroundSpeed;
    this.targetSpeed = this.baseSpeed;
    this.vx = this.baseSpeed;
    this.vy = 0;
    this.gravityDirection = 1;
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.jumpCount = 0;
    this.grounded = false;
    this.hitCeiling = false;
    this.hitWall = false;
    this.rotation = 0;
    this.alive = true;
    this.jumpCountLimit = 1;
    this.maxJumpCount = 1;
    this.trail = [];
    this.trailSpawnTimer = 0;
    this.groundEntity = null;
    this.carriedBy = null;
    this.isCompleting = false;
  }

  setJumpCount(count) {
    this.jumpCountLimit = Math.max(1, count);
    this.maxJumpCount = this.jumpCountLimit;
  }

  setBaseSpeed(speed) {
    this.baseSpeed = speed;
    this.targetSpeed = speed;
  }

  setSpawnPoint(spawnPoint) {
    this.spawnPoint = { ...spawnPoint };
  }

  reset(spawnPoint = this.spawnPoint) {
    this.x = spawnPoint.x;
    this.y = spawnPoint.y;
    this.vx = this.baseSpeed;
    this.vy = 0;
    this.gravityDirection = 1;
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.jumpCount = 0;
    this.grounded = false;
    this.hitCeiling = false;
    this.hitWall = false;
    this.rotation = 0;
    this.alive = true;
    this.trail = [];
    this.trailSpawnTimer = 0;
    this.groundEntity = null;
    this.carriedBy = null;
    this.isCompleting = false;
  }

  queueJump() {
    this.jumpBufferTimer = this.config.physics.jumpBufferTime;
  }

  canJump() {
    if (this.grounded || this.coyoteTimer > 0) {
      return true;
    }

    if (this.jumpCount < this.maxJumpCount) {
      return true;
    }

    return false;
  }

  performJump(source = "jump") {
    const isAirJump = !this.grounded && this.coyoteTimer <= 0 && this.jumpCount >= 1;
    const jumpVelocity = isAirJump
      ? this.config.physics.doubleJumpVelocity
      : this.config.physics.jumpVelocity;

    this.vy = -jumpVelocity * this.gravityDirection;
    this.grounded = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.jumpCount += 1;

    if (!isAirJump) {
      return {
        type: "jump",
        source
      };
    }

    return {
      type: "airJump",
      jumpCount: this.jumpCount,
      source
    };
  }

  bounce(multiplier = 1.18) {
    const velocity = this.config.physics.jumpVelocity * multiplier;
    this.vy = -velocity * this.gravityDirection;
    this.grounded = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.jumpCount = Math.min(Math.max(this.jumpCount, 1), this.maxJumpCount);
  }

  flipGravity() {
    this.gravityDirection *= -1;
    this.y += this.gravityDirection * -6;
    this.grounded = false;
    this.coyoteTimer = 0;
  }

  update(dt, context) {
    if (!this.alive) {
      return null;
    }

    const { input, physics, level, dynamicSolids } = context;
    let actionResult = null;

    if (input.consume("jump")) {
      this.queueJump();
    }

    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);

    if (this.grounded) {
      this.coyoteTimer = this.config.physics.coyoteTime;
      this.jumpCount = 0;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (this.jumpBufferTimer > 0 && this.canJump()) {
      actionResult = this.performJump("buffered");
    }

    this.vx = this.targetSpeed;
    this.vy += this.config.physics.gravity * this.gravityDirection * dt;
    this.vy = clamp(this.vy, -this.config.physics.maxFallSpeed, this.config.physics.maxFallSpeed);
    this.rotation += this.config.physics.rotationSpeed * dt * this.gravityDirection;

    physics.moveActor(this, level, dynamicSolids, dt);

    if (this.grounded) {
      const quarterTurn = Math.PI / 2;
      this.rotation = Math.round(this.rotation / quarterTurn) * quarterTurn;
    }

    this.trailSpawnTimer -= dt;

    if (this.trailSpawnTimer <= 0) {
      this.trailSpawnTimer = this.config.player.trailSpacing;
      this.trail.push({
        x: this.x + this.width * 0.5,
        y: this.y + this.height * 0.5,
        rotation: this.rotation,
        life: this.config.player.trailLife,
        maxLife: this.config.player.trailLife,
        gravityDirection: this.gravityDirection
      });
    }

    for (const piece of this.trail) {
      piece.life -= dt;
    }

    this.trail = this.trail.filter((piece) => piece.life > 0);

    return actionResult;
  }

  draw(renderer) {
    const ctx = renderer.ctx;

    for (const trailPiece of this.trail) {
      const alpha = trailPiece.life / trailPiece.maxLife;
      ctx.save();
      ctx.translate(trailPiece.x, trailPiece.y);
      ctx.rotate(trailPiece.rotation);
      ctx.globalAlpha = alpha * 0.36;
      ctx.fillStyle = trailPiece.gravityDirection > 0 ? "#7bf7ff" : "#ff9fd4";
      ctx.fillRect(-this.width * 0.4, -this.height * 0.4, this.width * 0.8, this.height * 0.8);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x + this.width * 0.5, this.y + this.height * 0.5);
    ctx.rotate(this.rotation);
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.gravityDirection > 0 ? "#7bf7ff" : "#ff9fd4";
    ctx.fillStyle = this.gravityDirection > 0 ? "#90fbff" : "#ffc0dc";
    ctx.fillRect(-this.width * 0.5, -this.height * 0.5, this.width, this.height);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillRect(-this.width * 0.34, -this.height * 0.34, this.width * 0.3, this.height * 0.3);
    ctx.restore();
  }
}
