/**
 * Vitrina + admin parallel (turbopack yoki `next start`).
 * Tashqiy `concurrently` o‘rnatilishi shart emas.
 *
 *   node scripts/dev-frontends.cjs          # next dev: :3000, :3001
 *   node scripts/dev-frontends.cjs start    # avvalo `npm run build:frontends`
 */
const { spawn } = require("node:child_process");
const path = require("node:path");

const root = path.join(__dirname, "..");
const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";
const mode = process.argv[2] === "start" ? "start" : "dev";

const common = {
  cwd: root,
  env: { ...process.env, FORCE_COLOR: "1" },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
};

const aArgs =
  mode === "dev"
    ? ["run", "dev", "--prefix", "frontends/storefront"]
    : ["run", "start", "--prefix", "frontends/storefront", "--", "-p", "3000"];

const bArgs =
  mode === "dev"
    ? ["run", "dev", "--prefix", "frontends/admin-panel", "--", "--port", "3001"]
    : ["run", "start", "--prefix", "frontends/admin-panel", "--", "-p", "3001"];

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
function stopAll() {
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
    process.exit(0);
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
    process.exitCode = code && code !== 0 ? code : 1;
    stopAll();
  });
}

process.on("SIGINT", () => {
  process.stderr.write("\n[dev-frontends] SIGINT\n");
  stopAll();
});
process.on("SIGTERM", () => {
  process.stderr.write("\n[dev-frontends] SIGTERM\n");
  stopAll();
});
