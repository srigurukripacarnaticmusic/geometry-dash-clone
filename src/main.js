import { GAME_CONFIG } from "./config/gameConfig.js";
import { Game } from "./core/Game.js";

const canvas = document.getElementById("gameCanvas");
const game = new Game(canvas, GAME_CONFIG);

async function boot() {
  await game.init();
  game.start();
  window.__NEON_RUSH_BOOT_STATUS__ = "ready";
}

boot().catch((error) => {
  window.__NEON_RUSH_BOOT_STATUS__ = "error";
  console.error("Failed to boot Neon Rush.", error);
  const overlayRoot = document.getElementById("overlayRoot");

  if (overlayRoot) {
    overlayRoot.innerHTML = `
      <section class="screen active modal-screen">
        <div class="panel modal-panel">
          <h2>Boot Error</h2>
          <p>The game could not start. Open the console for details.</p>
          <pre style="text-align:left; white-space:pre-wrap;">${String(error)}</pre>
        </div>
      </section>
    `;
  }
});
