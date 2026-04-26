# @nasibashop/shared-config

Базовые настройки **TypeScript** и **Prettier** для приложений в `frontends/*`.

## TypeScript

Файл `tsconfig.base.json` — **эталон** общих `compilerOptions`. В приложениях `frontends/*` эти опции **продублированы** в корневом `tsconfig.json` без `extends`: Next.js 15 с **Turbopack** иначе выдаёт ошибку разбора `tsconfig.json` (`extends` на другой пакет или на `../../packages/...` не разрешается).

При изменении базы обновите вручную `compilerOptions` во `frontends/storefront/tsconfig.json` и `frontends/admin-panel/tsconfig.json` (плюс плагин Next и `paths`).

Эталон для сравнения:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true
  }
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
