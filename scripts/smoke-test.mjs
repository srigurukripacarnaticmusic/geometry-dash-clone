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
  const lateLevelExpectations = [
    { cardIndex: 5, levelName: "Orbit Steps", hudMode: "7 Jumps" },
    { cardIndex: 6, levelName: "Shock Circuit", hudMode: "8 Jumps" },
    { cardIndex: 7, levelName: "Sky Splitter", hudMode: "9 Jumps" },
    { cardIndex: 8, levelName: "Core Surge", hudMode: "10 Jumps" },
    { cardIndex: 9, levelName: "Apex Rush", hudMode: "11 Jumps" }
  ];
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = [];
  const pageErrors = [];
  async function pressKey(code) {
    await page.evaluate((keyCode) => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: keyCode, bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keyup", { code: keyCode, bubbles: true }));
    }, code);
  }

  async function openPauseMenu() {
    await pressKey("KeyP");
    await page.waitForFunction(() => document.querySelector("#screenPause")?.classList.contains("active"), { timeout: 5000 });
  }

  page.on("console", (msg) => logs.push({ type: msg.type(), text: msg.text() }));
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  await page.goto(${JSON.stringify(fileUrl)}, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  const initialJumpCap = await page.locator("#jumpCountSlider").evaluate((el) => Number(el.max));
  const initialJumpCountValue = await page.locator("#jumpCountValue").textContent();
  await page.click("#startGameButton");
  await page.waitForFunction(() => {
    const hud = document.querySelector("#hud");
    return hud && !hud.classList.contains("hidden");
  });
  const levelOneHudMode = await page.locator("#hudMode").textContent();
  await openPauseMenu();
  await page.click("#exitLevelButton");
  await page.waitForTimeout(300);
  await page.click("#levelSelectButton");
  await page.waitForTimeout(200);
  const levelSelectActive = await page.locator("#screenLevelSelect").evaluate((el) => el.classList.contains("active"));
  await page.click("#backToMenuButton");
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    localStorage.setItem("neon-rush-save-v1", JSON.stringify({
      settings: {
        jumpCount: 1,
        touchControls: false,
        masterVolume: 0.32
      },
      progress: {
        unlockedLevels: ["level-01", "level-02", "level-03"],
        bestPercentByLevel: { "level-01": 1, "level-02": 0.86 },
        completedLevels: ["level-01", "level-02"]
      }
    }));
  });
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(1200);
  const jumpCapAfterUnlock = await page.locator("#jumpCountSlider").evaluate((el) => Number(el.max));
  const jumpCountValue = await page.locator("#jumpCountValue").textContent();
  await page.click("#levelSelectButton");
  await page.waitForTimeout(200);
  await page.locator("#levelGrid .level-card").nth(2).locator("button").click();
  await page.waitForFunction(() => {
    const hud = document.querySelector("#hud");
    return hud && !hud.classList.contains("hidden");
  });
  const hudVisible = await page.locator("#hud").evaluate((el) => !el.classList.contains("hidden"));
  const hudMode = await page.locator("#hudMode").textContent();
  await openPauseMenu();
  const pauseVisible = await page.locator("#screenPause").evaluate((el) => el.classList.contains("active"));
  await page.click("#resumeButton");
  await page.waitForTimeout(200);
  await pressKey("KeyR");
  await page.waitForTimeout(900);
  const attempt = await page.locator("#hudAttempt").textContent();
  await page.evaluate(() => {
    localStorage.setItem("neon-rush-save-v1", JSON.stringify({
      settings: {
        jumpCount: 1,
        touchControls: false,
        masterVolume: 0.32
      },
      progress: {
        unlockedLevels: ["level-01", "level-02", "level-03", "level-04", "level-05", "level-06", "level-07", "level-08", "level-09", "level-10"],
        bestPercentByLevel: {
          "level-01": 1,
          "level-02": 1,
          "level-03": 1,
          "level-04": 1,
          "level-05": 1,
          "level-06": 0.72,
          "level-07": 0.58,
          "level-08": 0.43,
          "level-09": 0.37
        },
        completedLevels: ["level-01", "level-02", "level-03", "level-04", "level-05", "level-06", "level-07", "level-08", "level-09"]
      }
    }));
  });
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(1200);
  const maxedJumpCountValue = await page.locator("#jumpCountValue").textContent();
  const lateLevelSafeStarts = [];
  await page.click("#levelSelectButton");
  await page.waitForTimeout(200);

  for (const [index, expectation] of lateLevelExpectations.entries()) {
    await page.locator("#levelGrid .level-card").nth(expectation.cardIndex).locator("button").click();
    await page.waitForFunction(() => {
      const hud = document.querySelector("#hud");
      return hud && !hud.classList.contains("hidden");
    });
    const snapshot = await page.evaluate(() => ({
      levelName: document.querySelector("#hudLevelName").textContent,
      hudMode: document.querySelector("#hudMode").textContent,
      attempt: Number(document.querySelector("#hudAttempt").textContent),
      hudVisible: !document.querySelector("#hud").classList.contains("hidden")
    }));
    lateLevelSafeStarts.push(snapshot);

    if (index < lateLevelExpectations.length - 1) {
      await page.reload({ waitUntil: "load" });
      await page.waitForTimeout(1200);
      await page.click("#levelSelectButton");
      await page.waitForTimeout(200);
    }
  }

  const summary = {
    initialJumpCap,
    initialJumpCountValue,
    levelOneHudMode,
    levelSelectActive,
    jumpCapAfterUnlock,
    jumpCountValue,
    maxedJumpCountValue,
    hudVisible,
    hudMode,
    pauseVisible,
    attempt,
    lateLevelSafeStarts,
    pageErrors,
    consoleErrors: logs.filter((entry) => entry.type === "error")
  };

  if (!levelSelectActive) {
    throw new Error("Level select screen did not open.");
  }

  if (initialJumpCap !== 2) {
    throw new Error(\`Expected initial jump cap 2, got \${initialJumpCap}.\`);
  }

  if (initialJumpCountValue !== "2 Jumps") {
    throw new Error(\`Expected a fresh save to default to 2 Jumps, got \${initialJumpCountValue}.\`);
  }

  if (levelOneHudMode !== "2 Jumps") {
    throw new Error(\`Expected Level 1 HUD to show 2 Jumps, got \${levelOneHudMode}.\`);
  }

  if (jumpCapAfterUnlock !== 4) {
    throw new Error(\`Expected unlocked jump cap 4, got \${jumpCapAfterUnlock}.\`);
  }

  if (jumpCountValue !== "4 Jumps") {
    throw new Error(\`Expected migrated save to upgrade to 4 Jumps, got \${jumpCountValue}.\`);
  }

  if (!hudVisible || hudMode !== "4 Jumps") {
    throw new Error(\`Expected Level 3 HUD to show 4 Jumps, got \${hudMode}.\`);
  }

  if (!pauseVisible) {
    throw new Error("Pause screen did not open.");
  }

  if (Number(attempt) < 2) {
    throw new Error(\`Expected restart attempt counter to increase, got \${attempt}.\`);
  }

  if (maxedJumpCountValue !== "11 Jumps") {
    throw new Error(\`Expected a fully unlocked save to default to 11 Jumps, got \${maxedJumpCountValue}.\`);
  }

  for (const [index, expectation] of lateLevelExpectations.entries()) {
    const snapshot = lateLevelSafeStarts[index];

    if (!snapshot?.hudVisible) {
      throw new Error(\`Expected \${expectation.levelName} HUD to be visible.\`);
    }

    if (snapshot.levelName !== expectation.levelName) {
      throw new Error(\`Expected level name \${expectation.levelName}, got \${snapshot.levelName}.\`);
    }

    if (snapshot.hudMode !== expectation.hudMode) {
      throw new Error(\`Expected \${expectation.levelName} to show \${expectation.hudMode}, got \${snapshot.hudMode}.\`);
    }
  }

  if (pageErrors.length || summary.consoleErrors.length) {
    throw new Error("Browser errors were reported during the smoke test.");
  }

  console.log(JSON.stringify(summary, null, 2));
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
