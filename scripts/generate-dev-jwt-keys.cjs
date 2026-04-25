/**
 * Генерирует RS256 dev-пару для user-service + вставляет public PEM в Kong declarative/kong.yml.
 * Запуск из корня репозитория: node scripts/generate-dev-jwt-keys.cjs
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
const devDir = path.join(root, "services", "api-gateway", "declarative", "dev-not-for-prod");
const kongPath = path.join(root, "services", "api-gateway", "declarative", "kong.yml");

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

fs.mkdirSync(devDir, { recursive: true });
fs.writeFileSync(path.join(devDir, "jwt_dev_private.pem"), privateKey, { mode: 0o600 });
fs.writeFileSync(path.join(devDir, "jwt_dev_public.pem"), publicKey);

const kong = fs.readFileSync(kongPath, "utf8");
const indented = publicKey
  .trim()
  .split("\n")
  .map((line) => `          ${line}`)
  .join("\n");

const replaced = kong.replace(/rsa_public_key: \|\n(?:          .*\n)+/, `rsa_public_key: |\n${indented}\n`);
if (replaced === kong) {
  console.error("Не найден блок rsa_public_key в kong.yml");
  process.exit(1);
}
fs.writeFileSync(kongPath, replaced);
console.log("OK: jwt_dev_private.pem, jwt_dev_public.pem и kong.yml обновлены.");
console.log("Экспортируйте JWT_PRIVATE_KEY / JWT_PUBLIC_KEY из PEM для user-service (см. dev-not-for-prod/README.md).");
