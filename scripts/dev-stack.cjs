/**
 * Кросс-платформенный старт: полный бэкенд + инфраструктура.
 * Подставляет KONG в конфиг, чтобы дочерний compose смотрел на сервисы в сети.
 */
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.join(__dirname, "..");
const env = { ...process.env };
// Относительный путь к корню репозитория — подстановка в docker-compose для volume
env.KONG_DECLARATIVE_CONFIG_FILE = "./services/api-gateway/declarative/kong.docker.yml";

const args = [
  "compose",
  "-f",
  "docker-compose.yml",
  "-f",
  "docker-compose.services.yml",
  "up",
  "-d",
  "--build",
  ...process.argv.slice(2),
];
const r = spawn("docker", args, { stdio: "inherit", env, cwd: root, shell: false });
r.on("exit", (code) => process.exit(code ?? 1));
r.on("error", (err) => {
  console.error(err);
  process.exit(1);
});
