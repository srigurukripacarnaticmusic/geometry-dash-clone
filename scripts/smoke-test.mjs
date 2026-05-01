import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const bundledNode = "C:\\Users\\Ram\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe";
const playwrightNodePath = "C:\\Users\\Ram\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";

const script = `
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = [];
  const pageErrors = [];
  page.on("console", (msg) => logs.push({ type: msg.type(), text: msg.text() }));
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  await page.goto("http://127.0.0.1:8080", { waitUntil: "networkidle" });
  await page.click("#levelSelectButton");
  await page.waitForTimeout(200);
  const levelSelectActive = await page.locator("#screenLevelSelect").evaluate((el) => el.classList.contains("active"));
  await page.click("#backToMenuButton");
  await page.waitForTimeout(200);
  await page.check("#doubleJumpToggle");
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
