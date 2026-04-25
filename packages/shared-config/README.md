# @nasibashop/shared-config

Базовые настройки **TypeScript** и **Prettier** для приложений в `frontends/*`.

## TypeScript

В `tsconfig.json` приложения:

```json
{
  "extends": "../../packages/shared-config/tsconfig.base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Prettier

Из корня монорепо (или с указанием конфига):

```bash
npx prettier -w "**/*.{ts,tsx,md,css}" --config packages/shared-config/prettier.config.cjs
```

Или добавьте в `package.json` приложения:

```json
"prettier": "../packages/shared-config/prettier.config.cjs"
```
