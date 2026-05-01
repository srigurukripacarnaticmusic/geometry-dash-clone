export const LEVEL_DATA = {
  "level-01": {
    "id": "level-01",
    "name": "Neon Run",
    "description": "Intro course with steady rhythm, bounce timing, gravity flips, and moving-platform recovery sections.",
    "width": 176,
    "height": 15,
    "tileSize": 48,
    "baseSpeed": 240,
    "finishX": 171,
    "songId": "neonPulse",
    "meta": {
      "author": "Codex",
      "difficulty": "Normal"
    },
    "player": {
      "spawnX": 4,
      "spawnY": 12.25
    },
    "colors": {
      "skyTop": "#102744",
      "skyBottom": "#05101d",
      "glow": "#7bf7ff",
      "accent": "#ffe57a",
      "tile": "#23496d"
    },
    "tiles": {
      "solids": [
        "################################################################################################################################################################################",
        "................................................................................................................................................................................",
        "................................................................................................................................................................................",
        "................................................................................................................................................................................",
        "................................................................................................................................................................................",
        "................................................................................................................................................................................",
        "................................................................................................................................................................................",
        "....................................................................................................................................................#################...........",
        "..........................................#######################...............................................#####################...........................................",
        "................................................................................................................................................................................",
        "....................................................................................########........########....................................................................",
        "................................................................................................................................................................................",
        "................................................................................................................................................................................",
        "################################################################################.....#################################....######################################################",
        "################################################################################.....#################################....######################################################"
      ]
    },
    "objects": [
      {
        "type": "spike",
        "x": 10,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 12,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 14,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 18,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 21,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "jumpPad",
        "x": 24,
        "y": 12.75,
        "width": 1,
        "height": 0.25,
        "power": 1.28,
        "color": "#ffe57a"
      },
      {
        "type": "spike",
        "x": 28,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 30,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 32,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "portal",
        "portalType": "gravity",
        "x": 38,
        "y": 9,
        "width": 1,
        "height": 3,
        "targetGravity": -1
      },
      {
        "type": "spike",
        "x": 44,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 46,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 48,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 50,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 52,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 54,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 56,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "block",
        "x": 54,
        "y": 4,
        "width": 2,
        "height": 1,
        "color": "#395b84"
      },
      {
        "type": "portal",
        "portalType": "gravity",
        "x": 62,
        "y": 6,
        "width": 1,
        "height": 3,
        "targetGravity": 1
      },
      {
        "type": "spike",
        "x": 69,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 72,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "portal",
        "portalType": "speed",
        "x": 74,
        "y": 9,
        "width": 1,
        "height": 3,
        "speedMultiplier": 1.32
      },
      {
        "type": "movingPlatform",
        "x": 80,
        "y": 12,
        "width": 2,
        "height": 0.5,
        "axis": "y",
        "distance": 2,
        "speed": 66,
        "color": "#9fe0ff"
      },
      {
        "type": "checkpoint",
        "x": 93,
        "y": 10.5,
        "width": 0.4,
        "height": 2,
        "color": "#ffe57a"
      },
      {
        "type": "spike",
        "x": 99,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 101,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 103,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 105,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "jumpPad",
        "x": 108,
        "y": 12.75,
        "width": 1,
        "height": 0.25,
        "power": 1.24,
        "color": "#ffe57a"
      },
      {
        "type": "spike",
        "x": 114,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "portal",
        "portalType": "gravity",
        "x": 120,
        "y": 9,
        "width": 1,
        "height": 3,
        "targetGravity": -1
      },
      {
        "type": "spike",
        "x": 124,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 127,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 130,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 133,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 136,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "portal",
        "portalType": "gravity",
        "x": 136,
        "y": 6,
        "width": 1,
        "height": 3,
        "targetGravity": 1
      },
      {
        "type": "movingPlatform",
        "x": 144,
        "y": 10.5,
        "width": 2,
        "height": 0.5,
        "axis": "x",
        "distance": 3,
        "speed": 54,
        "color": "#89ffb0"
      },
      {
        "type": "spike",
        "x": 151,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 153,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 155,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "jumpPad",
        "x": 158,
        "y": 12.75,
        "width": 1,
        "height": 0.25,
        "power": 1.32,
        "color": "#ffe57a"
      },
      {
        "type": "spike",
        "x": 164,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 166,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      }
    ]
  },
  "level-02": {
    "id": "level-02",
    "name": "Gravity Groove",
    "description": "Faster sections with back-to-back gravity routing, moving platforms, and denser spike timing.",
    "width": 224,
    "height": 15,
    "tileSize": 48,
    "baseSpeed": 240,
    "finishX": 219,
    "songId": "gravityDrive",
    "meta": {
      "author": "Codex",
      "difficulty": "Hard"
    },
    "player": {
      "spawnX": 4,
      "spawnY": 12.25
    },
    "colors": {
      "skyTop": "#24133f",
      "skyBottom": "#07101d",
      "glow": "#89ffb0",
      "accent": "#7bf7ff",
      "tile": "#3d3d7d"
    },
    "tiles": {
      "solids": [
        "################################################################################################################################################################################################################################",
        "................................................................................................................................................................................................................................",
        "................................................................................................................................................................................................................................",
        "................................................................................................................................................................................................................................",
        "................................................................................................................................................................................................................................",
        "................................................................................................................................................................................................................................",
        "................................................................................................................................................................................................................................",
        "..................................#############################.................................................................................................................................................................",
        "........................................................................................##########################..............................................................#####################...........................",
        "..........................................................................................................................................#######################...............................................................",
        "................................................................................................................................................................................................................................",
        "................................................................................................................................................................................................................................",
        "................................................................................................................................................................................................................................",
        "################################################.....###############################################################.....#################################################################.....#################################",
        "################################################.....###############################################################.....#################################################################.....#################################"
      ]
    },
    "objects": [
      {
        "type": "spike",
        "x": 9,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 11,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 13,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 15,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "jumpPad",
        "x": 18,
        "y": 12.75,
        "width": 1,
        "height": 0.25,
        "power": 1.3,
        "color": "#ffe57a"
      },
      {
        "type": "spike",
        "x": 23,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 25,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 27,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "portal",
        "portalType": "gravity",
        "x": 31,
        "y": 9,
        "width": 1,
        "height": 3,
        "targetGravity": -1
      },
      {
        "type": "spike",
        "x": 36,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 38,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 40,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 42,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 44,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 46,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "portal",
        "portalType": "speed",
        "x": 45,
        "y": 6,
        "width": 1,
        "height": 3,
        "speedMultiplier": 1.45
      },
      {
        "type": "movingPlatform",
        "x": 48,
        "y": 12,
        "width": 2,
        "height": 0.5,
        "axis": "y",
        "distance": 2,
        "speed": 72,
        "color": "#7bf7ff"
      },
      {
        "type": "portal",
        "portalType": "gravity",
        "x": 58,
        "y": 6,
        "width": 1,
        "height": 3,
        "targetGravity": 1
      },
      {
        "type": "spike",
        "x": 66,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 68,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 70,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 72,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "checkpoint",
        "x": 78,
        "y": 10.5,
        "width": 0.4,
        "height": 2,
        "color": "#ffe57a"
      },
      {
        "type": "jumpPad",
        "x": 84,
        "y": 12.75,
        "width": 1,
        "height": 0.25,
        "power": 1.2,
        "color": "#ffe57a"
      },
      {
        "type": "spike",
        "x": 92,
        "y": 7,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 94,
        "y": 7,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 96,
        "y": 7,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "portal",
        "portalType": "gravity",
        "x": 104,
        "y": 9,
        "width": 1,
        "height": 3,
        "targetGravity": -1
      },
      {
        "type": "spike",
        "x": 110,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 113,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 116,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 119,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "portal",
        "portalType": "gravity",
        "x": 118,
        "y": 6,
        "width": 1,
        "height": 3,
        "targetGravity": 1
      },
      {
        "type": "movingPlatform",
        "x": 116,
        "y": 12,
        "width": 2,
        "height": 0.5,
        "axis": "x",
        "distance": 3,
        "speed": 58,
        "color": "#89ffb0"
      },
      {
        "type": "spike",
        "x": 126,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 128,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 130,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 132,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 134,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "portal",
        "portalType": "speed",
        "x": 138,
        "y": 9,
        "width": 1,
        "height": 3,
        "speedMultiplier": 1.55
      },
      {
        "type": "block",
        "x": 146,
        "y": 10,
        "width": 2,
        "height": 1,
        "color": "#355374"
      },
      {
        "type": "block",
        "x": 149,
        "y": 9,
        "width": 2,
        "height": 1,
        "color": "#355374"
      },
      {
        "type": "jumpPad",
        "x": 153,
        "y": 12.75,
        "width": 1,
        "height": 0.25,
        "power": 1.34,
        "color": "#ffe57a"
      },
      {
        "type": "portal",
        "portalType": "gravity",
        "x": 166,
        "y": 9,
        "width": 1,
        "height": 3,
        "targetGravity": -1
      },
      {
        "type": "spike",
        "x": 172,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 174,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 176,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 178,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "spike",
        "x": 180,
        "y": 1,
        "width": 1,
        "height": 1,
        "direction": "down",
        "color": "#ff9fd4"
      },
      {
        "type": "movingPlatform",
        "x": 186,
        "y": 12,
        "width": 2,
        "height": 0.5,
        "axis": "y",
        "distance": 2,
        "speed": 74,
        "color": "#9fe0ff"
      },
      {
        "type": "portal",
        "portalType": "gravity",
        "x": 194,
        "y": 6,
        "width": 1,
        "height": 3,
        "targetGravity": 1
      },
      {
        "type": "spike",
        "x": 201,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 203,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 205,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 207,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "spike",
        "x": 209,
        "y": 12,
        "width": 1,
        "height": 1,
        "direction": "up",
        "color": "#ff6e96"
      },
      {
        "type": "jumpPad",
        "x": 213,
        "y": 12.75,
        "width": 1,
        "height": 0.25,
        "power": 1.35,
        "color": "#ffe57a"
      }
    ]
  }
};
