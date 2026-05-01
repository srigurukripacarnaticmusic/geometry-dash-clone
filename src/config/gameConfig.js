export const GAME_CONFIG = {
  title: "Neon Rush",
  version: "1.0.0",
  canvas: {
    width: 1280,
    height: 720,
    maxPixelRatio: 2
  },
  loop: {
    fixedDelta: 1 / 120,
    maxFrameDelta: 1 / 15
  },
  physics: {
    gravity: 2200,
    jumpVelocity: 820,
    doubleJumpVelocity: 760,
    maxFallSpeed: 1700,
    coyoteTime: 0.07,
    jumpBufferTime: 0.11,
    defaultGroundSpeed: 240,
    rotationSpeed: Math.PI * 3.75
  },
  player: {
    width: 36,
    height: 36,
    trailSpacing: 0.028,
    trailLife: 0.24
  },
  camera: {
    followOffsetX: 350,
    followOffsetY: 0,
    verticalLook: 26,
    lerp: 0.12,
    shakeDamping: 7
  },
  render: {
    tileSize: 48,
    glowStrength: 16,
    gridMajorEvery: 4
  },
  gameplay: {
    restartDelay: 0.52,
    completeDelay: 1.2,
    checkpointEnabled: true,
    practiceMode: false
  },
  audio: {
    masterVolume: 0.32,
    scheduleAhead: 0.25,
    lookAheadMs: 40,
    analyserSize: 2048
  },
  storageKeys: {
    saveData: "neon-rush-save-v1"
  }
};
