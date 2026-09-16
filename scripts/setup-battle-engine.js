/**
 * Creates a Python venv under battle-engine/.venv and installs requirements.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const engineDir = path.resolve(__dirname, "..", "battle-engine");
const reqFile = path.join(engineDir, "requirements.txt");
const isWin = process.platform === "win32";
const venvDir = path.join(engineDir, ".venv");
const venvPython = isWin
  ? path.join(venvDir, "Scripts", "python.exe")
  : path.join(venvDir, "bin", "python");

function run(cmd, args) {
  // Never use shell:true with absolute paths that contain spaces.
  const result = spawnSync(cmd, args, {
    cwd: engineDir,
    stdio: "inherit",
    shell: false,
    windowsHide: true,
  });
  if (result.error) {
    console.error("[setup] failed to run:", cmd, args.join(" "));
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function resolvePythonLauncher() {
  if (isWin) {
    // `py -3` is the reliable Windows launcher
    const probe = spawnSync("py", ["-3", "--version"], {
      stdio: "ignore",
      shell: false,
      windowsHide: true,
    });
    if (probe.status === 0) {
      return { cmd: "py", args: ["-3"] };
    }
  }

  for (const candidate of ["python3", "python"]) {
    const probe = spawnSync(candidate, ["--version"], {
      stdio: "ignore",
      shell: false,
      windowsHide: true,
    });
    if (probe.status === 0) {
      return { cmd: candidate, args: [] };
    }
  }

  console.error(
    "[setup] No Python 3 interpreter found. Install Python 3.11+ and retry."
  );
  process.exit(1);
}

if (!fs.existsSync(reqFile)) {
  console.error("[setup] requirements.txt not found at", reqFile);
  process.exit(1);
}

const launcher = resolvePythonLauncher();

if (!fs.existsSync(venvPython)) {
  console.log("[setup] creating Python virtual environment...");
  run(launcher.cmd, [...launcher.args, "-m", "venv", ".venv"]);
} else {
  console.log("[setup] virtual environment already exists");
}

if (!fs.existsSync(venvPython)) {
  console.error("[setup] venv python missing after creation:", venvPython);
  process.exit(1);
}

console.log("[setup] installing Python dependencies...");
run(venvPython, ["-m", "pip", "install", "--upgrade", "pip"]);
run(venvPython, ["-m", "pip", "install", "-r", "requirements.txt"]);

console.log("[setup] battle engine ready.");
