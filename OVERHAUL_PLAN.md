# НПМ Фандом Вики — Global Overhaul Plan

Дата: 2026-09-12. Исходник: NPMOverhaul.zip, чистый git commit `83204d20f78e790bc3de964f7aa14668381840ff`; совпадение с GitHub HEAD проверено через `git ls-remote`. Рабочая копия: `outputs/npm-fandom-wiki`. Исходный архив не изменяется. Документ создан после аудита, до изменения исходного кода.

## PHASE 0 — обследованная архитектура

Прочитаны все 40 файлов src/backend, package.json и lock, Vite/PostCSS/Tailwind, index.html, обе README, env/gitignore/runtime, проверены импорты. React 18 + Router 6 + Vite 5 + Tailwind 3; FastAPI 0.104/Pydantic 1/SQLAlchemy 2. БД SQLite или PostgreSQL, таблицы characters/appearances. Контент: четыре опубликованных персонажа, пять арок, эпизоды, биографии/спойлеры, авторский список будущих персонажей и ссылки YouTube внутри страниц.

Исходный граф зависимостей:

```text
main → HashRouter → App → pages → layout/cards/navigation/theme
                       ↘ CharactersProvider → api/client → config (hardcoded URL)
                                            ↘ wiki_data.json
pages/components → useTelegram (повторная инициализация)
pages → useAdmin → config.ADMIN_ID + api/client.getTelegramUserId
backend/main → auth + schemas + crud → models → database
             → import-time create_all + startup seed → ../src/data/wiki_data.json
```

Циклических импортов в текущих исходниках не найдено. Основные проблемы — скрытые зависимости и смешение ответственности, а не import cycles.

### Подтверждённые дефекты и причины

1. **P0 авторизация:** любой клиент может подставить публичный admin ID в `X-Telegram-User-Id`. Сервер не проверяет подпись Telegram. ID и URL зашиты в исходниках, env пример не действует.
2. **P0 целостность:** `seed_if_empty` на каждом запуске воскрешает намеренно удалённый каталог; import-time create_all без миграций; SQLite на непостоянном диске теряет изменения.
3. **P1 состояние:** provider сразу отдаёт fallback, затем меняет его на API. Нет abort/request generation/защиты unmount. Любая ошибка подменяет каталог JSON, даже после успешной мутации.
4. **P1 CRUD:** после записи выполняется GET; сбой GET превращает успешную запись в неоднозначный результат и возвращает удалённые записи. Нет защиты от конкурирующих запросов/записей.
5. **P1 контракт:** API id integer, UI id slug плюс dbId; нет строгой нормализации ответа. 200 с не-JSON может стать строкой. PUT фактически partial, явный null ломает БД/appearances. Нет строгой валидации slug/цветов/коллекций.
6. **P1 БД:** duplicate POST precheck гоняется с insert (400 вместо 409); duplicate PUT даёт 500. Нет rollback стратегии, стабильного order, eager load; slug можно изменить и сломать связи/ссылки.
7. **P1 список:** искусственное окно 700 ms и отдельный loading; список по 29 hardcoded именам скрывает новых персонажей и рисует заглушки удалённых. Вторая арка всегда пустая независимо от API.
8. **P1 формы:** эффект перезаписывает dirty form при обновлении записи; missing edit target ведёт к ошибке existing.dbId; create доступен при fallback; confirmId=null совпадает с dbId всех fallback карточек. Нет защиты ухода/повторной отправки.
9. **P1 CORS/config:** wildcard origins + credentials; отсутствуют production validation, explicit origins, backend env, безопасный local admin flow.
10. **P2 Telegram:** повторные ready/expand, нет управляемых viewport/theme/safe area/back events; browser fallback частичный. Back (-1) на прямом входе может увести из приложения.
11. **P2 UI:** нет общего empty/error/fallback boundary, unknown route пустой; dashboard статические счётчики/фиктивный поиск; Arcs/Timeline разные правила доступности и дублируют media URLs.
12. **P2 animation/dialog:** canvas эффект зависит от ref, отсутствующего при loading; nullable canvas context не проверяется, бесконечная анимация вне экрана; race RAF/setTimeout при закрытии sheet; нет focus trap/Escape/scroll lock/reduced motion.
13. **P2 инструменты:** нет lint/test/CI/runtime проверок. Старые server dependencies включают неиспользуемый multipart. .env не исключён gitignore, .idea отслеживается. Токены дублируются в CSS/JS/Tailwind.

## Целевая архитектура

```text
app (router, providers, error boundary)
  → pages/components (render + user interaction)
  → hooks/context (explicit resource and auth state)
  → api endpoints → model mapper/validation → transport → config
  → content (read-only series, curated presentation, fallback snapshot)

backend app factory → routers → services → SQLAlchemy models/session
                    → auth dependency → verified Telegram identity
                    → schemas/errors/config
database schema managed by Alembic; seed is an explicit administrative command
```

Сохраняются React/JS, Tailwind, Hash URL routing, FastAPI/SQLAlchemy, SQLite local + PostgreSQL production; никакого Redux, нового UI framework или тотальной TypeScript миграции. Router 6 data router с hash URL допускается ради корректного blocking dirty forms. Палитра и оригинальный лор сохраняются.

## API contract (цель совместного изменения)

Базовый путь `/api`; UI его не знает. Wire Character сохраняет существующие camelCase поля. Character `id` — положительный integer, `slug` — уникальный неизменяемый URL-safe идентификатор; `version` — optimistic concurrency token. Полный контракт будет в API.md и OpenAPI.

| Метод | Путь | Request | Success | Auth/errors |
|---|---|---|---|---|
| GET | /api/health | — | 200 status + DB readiness | 503 DB unavailable |
| GET | /api/auth/session | signed initData / local dev token | 200 userId,isAdmin | 401 invalid/expired, 403 only at mutations |
| GET | /api/characters | — | 200 Character[] (включая []) | 500/503 |
| GET | /api/characters/{id} | positive DB id | 200 Character | 404,422 |
| POST | /api/characters | CharacterCreate | 201 Character | 401,403,409,422,500 |
| PUT | /api/characters/{id} | full editable Character + version | 200 Character, version increment | 401,403,404,409,422,500 |
| DELETE | /api/characters/{id} | If-Match version | 204 без JSON | 401,403,404,409,422,500 |

PUT становится полным, документированным обновлением; PATCH не нужен текущему продукту. Старый ID header больше не авторизует. Duplicate slug и stale version → 409. Неизменяемый slug защищает внешние ссылки. Удалённая цель связи может оставаться историческим текстом без активной ссылки; контент не удаляется каскадно из чужих биографий. Пустые обязательные строки, неверные enum, небезопасный slug, null коллекции/обязательные поля → 422. Ошибка: `{error:{code,message,fields?}}`; никаких traceback/SQL/секретов в ответе.

## Data model

Canonical frontend Character: `{id: number|null, slug, version: number|null, name, shortName, color, status, arc, role, occupation, race: string|null, avatarInitial, biography, abilities: string[], relationships: {slug,description}[], appearances: {episode,summary}[]}`. Fallback `id/version=null`, UI keys и ссылки используют slug. Mapper строгий на API boundary, отдельный adapter для legacy JSON; serializer удаляет служебные поля и возвращает relationships.id на wire. Ни один компонент не оперирует dbId.

Existing SQL schema сохраняется по данным; Alembic добавляет version/constraints/indexes и умеет принять existing database после проверки. Миграция должна отказать с понятной ошибкой при некорректных старых данных, а не исправлять лор молча. Backup перед production migration. Не выполнять drop/reseed существующей БД.

## State model / fallback

Resource status: `idle | loading | success | empty | fallback | error | refreshing | mutating`. Initial characters=[]; JSON появляется только после eligible network/timeout/5xx failure первого запроса. 401/403/422/contract failure не маскируются fallback. После первого API success сессия никогда не откатывается на JSON: при failed reload сохраняется последний подтверждённый snapshot с явной ошибкой и отключёнными мутациями до retry. Пустой API список — empty, а не fallback.

Latest-request-wins + AbortController; unmount отменяет reads. Повторные reload не побеждают более новые ответы. Mutation сериализована, не повторяется автоматически; stale reads инвалидируются; успешный response атомарно добавляет/заменяет/удаляет локальный canonical объект, без вторичного GET. Неоднозначный network outcome блокирует повторную запись до явной синхронизации. Backend version предотвращает потерю параллельных изменений между клиентами.

UI loading/canMutate/usingFallback — производные от state, не самостоятельные boolean. Контекст тонкий, transport/normalization вне context. Series — версионируемый редакционный контент, не альтернативный каталог персонажей.

## Auth model

Telegram raw initData передаётся в `X-Telegram-Init-Data`; backend проверяет HMAC-SHA256, constant-time compare, auth_date, формат/повторяющиеся параметры, Telegram user.id. BOT_TOKEN и ADMIN_IDS только server env. GET auth/session управляет видимостью UI; каждая mutation независимо проверяется сервером. Browser по умолчанию reader; при APP_ENV=development можно вручную ввести отдельный dev token, хранимый лишь в памяти. Production запрещает dev bypass. CORS exact allowlist, credentials=false, разрешены только необходимые методы/headers (включая If-Match); origin Telegram WebView — origin frontend сайта.

## Error model

NetworkError, TimeoutError, AuthenticationError, AuthorizationError, ValidationError, NotFoundError, ConflictError, ServerError, ContractError, UnknownError. Abort вследствие навигации не пользовательская ошибка. Timeout имеет понятный текст. Validation fields привязываются к форме; 401 требует повторно открыть Mini App/войти, 403 сообщает недостаток прав, 409 сохраняет draft и предлагает синхронизацию. Transport понимает 204/empty body и отклоняет нарушенный successful JSON contract.

## Migration plan и проверки по фазам

0. Audit завершён; baseline build/install и dependency graph фиксируются до обновления tooling.
1. Этот план — checkpoint; изменения исходников начинаются после него.
2. Backend config/app factory/services/routers, secure auth, schemas/errors, migrations/seed. Gate: pytest API/auth/DB/CORS/legacy migration.
3. Frontend config/client/endpoints/model/validation. Gate: transport/error/204/normalization/validation tests.
4. Resource state/provider + auth provider. Gate: loading/empty/fallback/stale requests/unmount/concurrent mutations tests.
5. Admin list/form CRUD, controlled validation/dirty guards, optimistic version conflicts. Gate: interaction/CRUD tests.
6. Один Telegram provider: ready/expand, viewport/safe area/theme/back/haptics, browser safe. Gate: SDK mocked lifecycle tests + actual browser without Telegram.
7. Общие tokens/status/dialog/form primitives; реальные catalog entries, preserved presentation/content, all routes and 404. Gate: build/lint + mobile browser inspection.
8. Vitest + Testing Library; pytest/httpx; meaningful failure tests, shared wire fixture. CI запускает все gates.
9. npm install/build/lint/test; backend process + real SQLite/API CRUD/auth/CORS/OPTIONS; frontend dev/preview and mobile/direct hash/refresh/fallback. Scan production bundle for loopback/config/secrets. Production cross-origin URL checked only read-only; no mutation against deployed service.
10. README, ARCHITECTURE, API, DECISIONS, OVERHAUL_REPORT with exact executed results and limits. User deliverable: source repository + convenient archive, no .env/credentials/build caches.

Независимые реализации можно выполнять параллельно после согласования контракта, но интеграционные gates обязательны до завершения. Реальный Telegram account/device, production BOT_TOKEN, production DB/deployment доступны только если предоставлены средой; отсутствие отражается как непроверенное, не как успех. Никаких публикаций или записей в live API без соответствующего запроса.

## Источники для проверенных решений

- [Telegram initData validation и Mini App lifecycle](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app)
- [FastAPI CORS](https://fastapi.tiangolo.com/tutorial/cors/)
- [React Router createHashRouter](https://reactrouter.com/6.30.1/routers/create-hash-router)
