# Dev-only JWT keys (RS256)

**Только для локальной разработки.** В production — своя пара ключей, секреты из Vault/Kubernetes Secret, **приватный ключ не хранить в репозитории**.

## Первый запуск после `git clone`

Из **корня** репозитория:

```bash
npm run jwt:dev
# или:
node scripts/generate-dev-jwt-keys.cjs
```

Скрипт:

1. Создаёт **`jwt_dev_private.pem`** (локально; файл в `.gitignore`, в git не попадает) и **`jwt_dev_public.pem`** (публичный можно коммитить как справочник).
2. Вставляет публичный PEM в **`../kong.yml`** в блок `consumers[].jwt_secrets[].rsa_public_key`.

## user-service

Подставьте PEM в переменные окружения (одна строка с `\n` или многострочно в compose):

```bash
cd services/user-service
# Linux/macOS:
export JWT_PRIVATE_KEY="$(cat ../api-gateway/declarative/dev-not-for-prod/jwt_dev_private.pem)"
export JWT_PUBLIC_KEY="$(cat ../api-gateway/declarative/dev-not-for-prod/jwt_dev_public.pem)"
```

Windows PowerShell:

```powershell
$env:JWT_PRIVATE_KEY = Get-Content ..\api-gateway\declarative\dev-not-for-prod\jwt_dev_private.pem -Raw
$env:JWT_PUBLIC_KEY = Get-Content ..\api-gateway\declarative\dev-not-for-prod\jwt_dev_public.pem -Raw
```

`JWT_ISSUER` по умолчанию **`nasibashop-user-service`** — должен совпадать с `key` в Kong consumer.

Затем `docker compose up -d kong` и запросы с заголовком `Authorization: Bearer <access>` на защищённые маршруты.

## Повторная генерация

Повторный запуск скрипта **сменит** ключи: снова обновите env user-service и перезапустите Kong (конфиг уже перезаписан скриптом).
