import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const bundledNode = "C:\\Users\\Ram\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe";
const playwrightNodePath = "C:\\Users\\Ram\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";
const fileUrl = pathToFileURL(path.join(rootDir, "index.html")).href;

const script = `
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = [];
  const pageErrors = [];
  page.on("console", (msg) => logs.push({ type: msg.type(), text: msg.text() }));
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  await page.goto(${JSON.stringify(fileUrl)}, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  await page.click("#levelSelectButton");
  await page.waitForTimeout(200);
  const levelSelectActive = await page.locator("#screenLevelSelect").evaluate((el) => el.classList.contains("active"));
  await page.click("#backToMenuButton");
  await page.waitForTimeout(200);
  const tripleDisabledBeforeUnlock = await page.locator("#tripleJumpToggle").evaluate((el) => el.disabled);
  await page.check("#doubleJumpToggle");
  await page.evaluate(() => {
    localStorage.setItem("neon-rush-save-v1", JSON.stringify({
      settings: {
        jumpMode: "triple",
        touchControls: false,
        masterVolume: 0.32
      },
      progress: {
        unlockedLevels: ["level-01", "level-02"],
        bestPercentByLevel: { "level-01": 1 },
        completedLevels: ["level-01"]
      }
    }));
  });
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(1200);
  const tripleDisabledAfterUnlock = await page.locator("#tripleJumpToggle").evaluate((el) => el.disabled);
  const tripleCheckedAfterUnlock = await page.locator("#tripleJumpToggle").evaluate((el) => el.checked);
  await page.click("#startGameButton");
  await page.waitForTimeout(1800);
  const hudVisible = await page.locator("#hud").evaluate((el) => !el.classList.contains("hidden"));
  const hudMode = await page.locator("#hudMode").textContent();
  await page.keyboard.press("KeyP");
  await page.waitForTimeout(200);
  const pauseVisible = await page.locator("#screenPause").evaluate((el) => el.classList.contains("active"));
  await page.click("#resumeButton");
  await page.waitForTimeout(200);
  await page.keyboard.press("KeyR");
  await page.waitForTimeout(900);
  const attempt = await page.locator("#hudAttempt").textContent();
  console.log(JSON.stringify({
    levelSelectActive,
    tripleDisabledBeforeUnlock,
    tripleDisabledAfterUnlock,
    tripleCheckedAfterUnlock,
    hudVisible,
    hudMode,
    pauseVisible,
    attempt,
    pageErrors,
    consoleErrors: logs.filter((entry) => entry.type === "error")
  }, null, 2));
  await browser.close();
})();
`;

const result = spawnSync(bundledNode, ["-e", script], {
  cwd: rootDir,
  env: {
    ...process.env,
    NODE_PATH: playwrightNodePath
  },
  stdio: "inherit"
});

process.exit(result.status ?? 1);
