/**
 * Cross-platform launcher for the Python battle engine.
 * Prefers a local venv if present; falls back to system Python.
 * Loads battle-engine/.env (and root .env) for PORT / HOST.
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const engineDir = path.join(root, "battle-engine");

try {
  require("dotenv").config({ path: path.join(root, ".env") });
  require("dotenv").config({
    path: path.join(engineDir, ".env"),
    override: true,
  });
} catch {
  // dotenv is a root devDependency
}

const host = process.env.BATTLE_HOST || "0.0.0.0";
const port = process.env.BATTLE_PORT || "8000";

function resolvePython() {
  const isWin = process.platform === "win32";
  const venvPython = isWin
    ? path.join(engineDir, ".venv", "Scripts", "python.exe")
    : path.join(engineDir, ".venv", "bin", "python");

  if (fs.existsSync(venvPython)) {
    return { cmd: venvPython, argsPrefix: [], useShell: false };
  }

  if (isWin) {
    return { cmd: "py", argsPrefix: ["-3"], useShell: false };
  }
  return { cmd: "python3", argsPrefix: [], useShell: false };
}

const { cmd, argsPrefix, useShell } = resolvePython();
const args = [
  ...argsPrefix,
  "-m",
  "uvicorn",
  "app.main:app",
  "--reload",
  "--host",
  host,
  "--port",
  String(port),
];

console.log(`[battle] starting: ${cmd} ${args.join(" ")}`);
console.log(`[battle] cwd: ${engineDir}`);

const child = spawn(cmd, args, {
  cwd: engineDir,
  stdio: "inherit",
  env: process.env,
  shell: useShell,
  windowsHide: true,
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[battle] received ${signal}, stopping...`);

  if (process.platform === "win32") {
    if (child.pid) {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
    }
  } else if (child.pid) {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

child.on("exit", (code, signal) => {
  if (signal || shuttingDown) {
    process.exit(0);
  }
  process.exit(code ?? 0);
});

child.on("error", (err) => {
  console.error(
    "[battle] failed to start Python process.",
    "Run `npm run setup` to create a venv and install requirements.",
    err.message
  );
  process.exit(1);
});
