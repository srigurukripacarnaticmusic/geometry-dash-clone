# Neon Rush

Neon Rush is a fully playable 2D rhythm platformer built with HTML5 Canvas, native ES modules, and the Web Audio API. It is inspired by the feel of Geometry Dash while keeping the code modular, data-driven, and scalable.

## Why This Stack

The web stack is the best fit for this project because it gives us:

- Tight control over frame-precise movement and rendering
- Simple distribution with no heavy engine dependency
- Native module separation for real project architecture
- Easy JSON-driven level authoring
- Fast iteration for gameplay tuning and UI polish

## Features

- Continuous auto-run platformer movement
- Configurable jump count that defaults to the highest unlocked value and scales with level progression
- Jump pads, gravity portals, speed portals, spikes, moving platforms, checkpoints
- Fixed-timestep physics and accurate collision handling
- Instant restart flow with screen shake and particles
- Music playback via Web Audio sequencer with beat-synced visuals
- JSON level loading and multi-level selection
- Save data for settings, unlocks, and best progress
- Pause menu, game over flash, HUD progress bar, touch controls
- Basic in-game editor toggle and export support

## Controls

- `Space`, `W`, `Up Arrow`, `Left Mouse`, `Touch` = Jump
- `P` or `Escape` = Pause
- `R` = Restart level
- `E` = Toggle editor
- `1` to `7` = Select editor object type
- `Delete` = Remove object under cursor in editor
- `Ctrl + S` while editor is open = Export level JSON to clipboard

## Run The Game

### Option 1: Open directly

1. Open [index.html](/C:/Users/Ram/Documents/Codex/2026-05-01/you-are-an-expert-game-developer/index.html) in a browser.
2. The production bundle is prebuilt, so the game can run without a dev server.

### Option 2: Python static server

1. Open a terminal in the project folder.
2. Run `python -m http.server 8080`
3. Open `http://localhost:8080`

### Option 3: npm script

1. Run `npm install` if your environment requires it for script resolution.
2. Run `npm run start`
3. Open `http://localhost:8080`

### Rebuild The Production Bundle

1. Run `node scripts/generate-levels.mjs` if you changed level definitions.
2. Run `npm run build`
3. Refresh the page.

## Verify Core Systems

1. Start the first level from the menu.
2. Press jump on the first spike section to confirm ground jump timing.
3. Raise the jump-count slider and verify the extra air jumps match the selected value.
4. Reach a yellow jump pad and confirm the boosted bounce and rotation.
5. Reach a cyan gravity portal and confirm the player flips to the ceiling.
6. Reach a green speed portal and confirm run speed increases immediately.
7. Die on a spike and confirm screen shake plus rapid restart.
8. Pause with `P` and verify the game freezes behind the overlay.
9. Return to level select and confirm unlocked progress persists.
10. On mobile or a narrow viewport, confirm the touch buttons appear.

## Testing Utilities

- `npm run validate` checks level JSON parsing, schema assumptions, and spawn/opening safety.
- `npm run count-lines` prints the total line count for source, JSON, HTML, and CSS files.
- `npm run smoke` launches a headless browser flow and verifies menu, level select, start, pause, and restart behavior.

## Deploy

Because the game is static, it can be deployed easily to:

- GitHub Pages
- Netlify
- Vercel
- Any static file host or CDN

## Suggested Improvements

- Add custom music import and waveform-based beat extraction
- Expand the editor into a full timeline/grid authoring workflow
- Add practice mode with manual checkpoints
- Add cosmetic player skins and color presets
- Add sprite atlases or WebGL batching for larger level counts
- Add deterministic replay ghosts for high-score competition
