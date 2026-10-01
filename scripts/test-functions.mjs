import { spawn, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const IS_WINDOWS = process.platform === "win32";
const PROJECT = process.env.FIREBASE_PROJECT_ID ?? "nightflow-test-project";
const SUITE = process.env.TEST_FUNCTIONS_SCRIPT ?? "npm --prefix functions run test";
const TIMEOUT_MS = Number(process.env.TEST_FUNCTIONS_TIMEOUT_MS ?? 600_000);

function killEmulatorJava() {
  if (IS_WINDOWS) {
    const ps = [
      "$ErrorActionPreference='SilentlyContinue'",
      "Get-CimInstance Win32_Process -Filter \"Name='java.exe'\" |",
      "Where-Object { $_.CommandLine -match 'firestore-emulator' } |",
      "ForEach-Object { Stop-Process -Id $_.ProcessId -Force }",
    ].join(" ");
    spawnSync("powershell.exe", ["-NoProfile", "-Command", ps], { stdio: "ignore", windowsHide: true });
    return;
  }
  spawnSync("pkill", ["-f", "firestore-emulator"], { stdio: "ignore" });
}

function killTree(pid) {
  if (IS_WINDOWS) {
    spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    return;
  }
  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    try {
      process.kill(pid, "SIGKILL");
    } catch {}
  }
}

const suiteArg = IS_WINDOWS ? `"${SUITE}"` : SUITE;
const args = ["emulators:exec", "--only", "firestore", "--project", PROJECT, suiteArg];

let finished = false;
let retried = false;
let child;

function finish(code) {
  if (finished) return;
  finished = true;
  killEmulatorJava();
  process.exit(code);
}

const watchdog = setTimeout(() => {
  console.error(`[test-functions] timeout de ${TIMEOUT_MS} ms alcanzado; forzando salida.`);
  killTree(child?.pid);
  finish(1);
}, TIMEOUT_MS);

function attach(c) {
  c.once("exit", (code) => {
    clearTimeout(watchdog);
    finish(code ?? 1);
  });
  c.once("error", (err) => {
    if (!retried) {
      retried = true;
      console.error(`[test-functions] firebase no disponible (${err.code ?? err.message}); reintentando con npx.`);
      child = spawn(
        "npx",
        ["firebase", ...args],
        { cwd: ROOT, stdio: "inherit", shell: IS_WINDOWS, windowsHide: true }
      );
      attach(child);
      return;
    }
    clearTimeout(watchdog);
    console.error("[test-functions] no se pudo lanzar firebase:", err.message);
    finish(1);
  });
}

child = spawn(
  "firebase",
  args,
  { cwd: ROOT, stdio: "inherit", shell: IS_WINDOWS, windowsHide: true }
);
attach(child);
