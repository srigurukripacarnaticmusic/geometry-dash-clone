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
  const jumpCapBeforeUnlock = await page.locator("#jumpCountSlider").evaluate((el) => Number(el.max));
  await page.evaluate(() => {
    localStorage.setItem("neon-rush-save-v1", JSON.stringify({
      settings: {
        jumpCount: 4,
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
  await page.locator("#jumpCountSlider").evaluate((el) => {
    el.value = "4";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
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
  await page.keyboard.press("KeyP");
  await page.waitForTimeout(200);
  const pauseVisible = await page.locator("#screenPause").evaluate((el) => el.classList.contains("active"));
  await page.click("#resumeButton");
  await page.waitForTimeout(200);
  await page.keyboard.press("KeyR");
  await page.waitForTimeout(900);
  const attempt = await page.locator("#hudAttempt").textContent();
  const summary = {
    levelSelectActive,
    jumpCapBeforeUnlock,
    jumpCapAfterUnlock,
    jumpCountValue,
    hudVisible,
    hudMode,
    pauseVisible,
    attempt,
    pageErrors,
    consoleErrors: logs.filter((entry) => entry.type === "error")
  };

  if (!levelSelectActive) {
    throw new Error("Level select screen did not open.");
  }

  if (jumpCapBeforeUnlock !== 2) {
    throw new Error(\`Expected starting jump cap 2, got \${jumpCapBeforeUnlock}.\`);
  }

  if (jumpCapAfterUnlock !== 4) {
    throw new Error(\`Expected unlocked jump cap 4, got \${jumpCapAfterUnlock}.\`);
  }

  if (jumpCountValue !== "4 Jumps") {
    throw new Error(\`Expected jump selector label to be 4 Jumps, got \${jumpCountValue}.\`);
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
