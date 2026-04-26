/**
 * Витрина и админка параллельно (Turbopack в dev или `next start`).
 * Внешний пакет `concurrently` не нужен.
 *
 *   node scripts/dev-frontends.cjs          # next dev: :3000, :3001 (см. env ниже)
 *   node scripts/dev-frontends.cjs start    # после `npm run build:frontends`
 *
 * Порты: NASIBASHOP_STOREFRONT_DEV_PORT (по умолчанию 3000), NASIBASHOP_ADMIN_DEV_PORT (3001).
 */
const { spawn } = require("node:child_process");
const path = require("node:path");

const root = path.join(__dirname, "..");
const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";
const mode = process.argv[2] === "start" ? "start" : "dev";

// На VPS глобальный NODE_ENV=production ломает `next dev`; для dev задаём явно.
const envBase = { ...process.env, FORCE_COLOR: "1" };
if (mode === "dev") {
  envBase.NODE_ENV = "development";
} else {
  envBase.NODE_ENV = "production";
}

const common = {
  cwd: root,
  env: envBase,
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
};

const storefrontDevPort = process.env.NASIBASHOP_STOREFRONT_DEV_PORT || "3000";
const adminDevPort = process.env.NASIBASHOP_ADMIN_DEV_PORT || "3001";

const aArgs =
  mode === "dev"
    ? [
        "run",
        "dev",
        "--prefix",
        "frontends/storefront",
        "--",
        "--port",
        storefrontDevPort,
      ]
    : [
        "run",
        "start",
        "--prefix",
        "frontends/storefront",
        "--",
        "-p",
        process.env.NASIBASHOP_STOREFRONT_START_PORT || "3000",
      ];

const bArgs =
  mode === "dev"
    ? [
        "run",
        "dev",
        "--prefix",
        "frontends/admin-panel",
        "--",
        "--port",
        adminDevPort,
      ]
    : [
        "run",
        "start",
        "--prefix",
        "frontends/admin-panel",
        "--",
        "-p",
        process.env.NASIBASHOP_ADMIN_START_PORT || "3001",
      ];

const a = spawn(npm, aArgs, common);
const b = spawn(npm, bArgs, common);
const children = [a, b];

function labelProc(label, ch) {
  if (!ch) return;
  for (const stream of ["stdout", "stderr"]) {
    if (!ch[stream]) continue;
    const out = stream === "stdout" ? process.stdout : process.stderr;
    ch[stream].on("data", (buf) => {
      out.write(`[${label}] `);
      out.write(buf);
    });
  }
}
labelProc("storefront", a);
labelProc("admin", b);

let shutting = false;
/** @param {number} exitCode код выхода процесса (0 — нормальное прерывание с клавиатуры) */
function stopAll(exitCode = 0) {
  if (shutting) return;
  shutting = true;
  for (const c of children) {
    try {
      c.kill("SIGTERM");
    } catch (_) {
      // ignore
    }
  }
  setTimeout(() => {
    for (const c of children) {
      try {
        c.kill("SIGKILL");
      } catch (_) {
        // ignore
      }
    }
    process.exit(exitCode);
  }, 2000);
}

let exits = 0;
for (const c of children) {
  c.on("exit", (code) => {
    if (shutting) {
      exits += 1;
      if (exits === children.length) process.exit(0);
      return;
    }
    console.error(`[dev-frontends] process exited, code: ${code ?? "?"}`);
    const exitCode = code !== 0 && code != null ? code : 1;
    stopAll(exitCode);
  });
}

process.on("SIGINT", () => {
  process.stderr.write("\n[dev-frontends] SIGINT\n");
  stopAll(0);
});
process.on("SIGTERM", () => {
  process.stderr.write("\n[dev-frontends] SIGTERM\n");
  stopAll(0);
});
