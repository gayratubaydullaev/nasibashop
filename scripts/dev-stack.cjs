/**
 * Docker Compose: инфраструктура + `docker-compose.services.yml`.
 * Kong → `kong.docker.yml` (upstream по имени сервиса в сети).
 *
 *   node scripts/dev-stack.cjs                 →  up -d --build
 *   node scripts/dev-stack.cjs down
 *   node scripts/dev-stack.cjs ps
 *   node scripts/dev-stack.cjs logs -f
 */
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.join(__dirname, "..");
const env = { ...process.env };
env.KONG_DECLARATIVE_CONFIG_FILE = "./services/api-gateway/declarative/kong.docker.yml";

const fromCli = process.argv.slice(2);
const composeArgs =
  fromCli.length > 0 ? fromCli : ["up", "-d", "--build"];

const args = [
  "compose",
  "-f",
  "docker-compose.yml",
  "-f",
  "docker-compose.services.yml",
  ...composeArgs,
];
const r = spawn("docker", args, { stdio: "inherit", env, cwd: root, shell: false });
r.on("exit", (code) => process.exit(code ?? 1));
r.on("error", (err) => {
  if (err.code === "ENOENT") {
    console.error("Docker not found. Install Docker and ensure it is in PATH.\n" + err.message);
  } else {
    console.error(err);
  }
  process.exit(1);
});
