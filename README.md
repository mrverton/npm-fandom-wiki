# НПМ Фандом Вики — Telegram Mini App

Фан-вики сериала «NPM»: персонажи, биографии со спойлерами, арки и звёздная хронология. Сохранены русский лор, палитры персонажей и cyberpunk эстетика.

Frontend: React 18, React Router с hash URL, Vite, Tailwind. Backend: FastAPI, Pydantic 2, SQLAlchemy 2, Alembic. SQLite — для локальной разработки; production использует постоянный PostgreSQL. Состояние персонажей приходит из API; статический архив никогда не редактируется через админку.

## Быстрый старт

Требуются Node.js 22.12+ (рекомендуется актуальная LTS) и Python 3.12. Команды запускаются из корня репозитория, если явно не указано иное.

```sh
npm install
```

Скопируйте `.env.example` в `.env`. По умолчанию frontend обращается к `/api`, а Vite dev server проксирует его на `http://127.0.0.1:8000`. Все server secrets настраиваются отдельно в `backend/.env`.

В первом терминале:

```sh
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements-dev.txt
# Скопируйте backend/.env.example в backend/.env.
python -m alembic upgrade head
# Только для новой пустой базы — явный импорт исходного лора:
python -m app.seed --file ../src/data/wiki_data.json
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Во втором терминале из корня:

```sh
npm run dev
```

Откройте [локальную вики](http://127.0.0.1:5173). [Health](http://127.0.0.1:8000/api/health) проверяет доступность базы и schema, [OpenAPI UI](http://127.0.0.1:8000/docs) описывает фактический API. Без backend интерфейс показывает явно обозначенный read-only архив, если до этого в текущей вкладке не было подтверждённого ответа API.

Seed не выполняется при старте сервера, не объединяет базы и отказывается перезаписывать непустую базу. Для обычного ежедневного запуска команды migration/seed повторять не требуется; migration нужна при изменении версии схемы, seed — только при осознанном первичном импорте.

## Configuration

| Переменная | Где | Назначение |
|---|---|---|
| `VITE_API_BASE_URL` | root `.env`, build environment | `/api` при same-origin proxy или HTTPS origin отдельного backend |
| `VITE_API_TIMEOUT_MS` | root `.env` | Таймаут запроса, по умолчанию 20000; 1000–120000 |
| `API_PROXY_TARGET` | root `.env`, только dev server | Адрес backend для Vite proxy |
| `APP_ENV` | backend `.env` | `development`, `production`, `test` |
| `DATABASE_URL` | backend `.env` | SQLite локально или PostgreSQL connection string |
| `ALLOWED_ORIGINS` | backend `.env` | Точные frontend origins через запятую; без wildcard и пути |
| `BOT_TOKEN` | backend `.env` | Секрет бота для проверки Telegram initData |
| `ADMIN_IDS` | backend `.env` | Разрешённые Telegram user IDs через запятую |
| `INIT_DATA_MAX_AGE_SECONDS` | backend `.env` | Срок подписанной сессии, по умолчанию 3600 |
| `DEV_ADMIN_TOKEN` | только development backend | Необязательный отдельный локальный токен, минимум 24 символа |
| `DEV_ADMIN_USER_ID` | только development backend | Проверочная локальная identity |

Frontend build отклоняет HTTP/loopback API в production. Значение `/api` подразумевает реально настроенный reverse proxy; static host сам по себе API не предоставляет. Изменение `VITE_*` требует пересборки. Ни bot token, ни database password, ни admin token не должны попадать в `VITE_*`, git или frontend deployment variables.

## Telegram и администраторы

1. Настройте бота и Mini App/menu button через [BotFather](https://t.me/BotFather), укажите HTTPS URL размещённого frontend.
2. На backend задайте `BOT_TOKEN`, `ADMIN_IDS`, `APP_ENV=production`, постоянный `DATABASE_URL` и точный frontend origin в `ALLOWED_ORIGINS`.
3. Откройте Mini App из Telegram. Frontend отправит raw initData на сервер; сервер проверит подпись и срок сессии, затем вернёт права. Кнопка админки появляется только по server-verified результату.
4. Каждая запись дополнительно авторизуется сервером. Старый `X-Telegram-User-Id` не даёт доступа. При истечении сессии откройте Mini App заново.

Для browser development можно задать `DEV_ADMIN_TOKEN` на локальном backend и вручную ввести его на `/#/admin`. Токен хранится только в памяти до reload/logout; production backend отвергает dev bypass. В обычном browser чтение доступно без Telegram SDK/учётной записи.

Telegram provider управляет ready/expand, safe area, stable viewport, темой chrome, BackButton и haptics. Optional native methods проверяются по возможностям клиента. Содержимое приложения сохраняет тёмную художественную тему.

## Работа с контентом и CRUD

Опубликованные персонажи изменяются через админский API. Создание/редактирование валидирует поля на frontend и backend; slug постоянный и уникальный, id назначается БД. После успешного ответа изменения сразу отражаются в state без дополнительного GET. Параллельная устаревшая запись отклоняется с `409` по version.

Форма сохраняет введённый текст при API ошибках и reload каталога, предупреждает об уходе и требует явного подтверждения reset. Во время записи повторный submit и другие mutations блокируются. Если сеть прервалась, сервер мог уже сохранить запрос: сначала обновите каталог, проверьте результат и только затем повторяйте действие.

Арки, эпизоды и исходный fallback snapshot находятся в `src/data/wiki_data.json`. Авторский roadmap будущих статей и видеоссылки — в `src/data/editorial.js`. Изменение JSON не меняет production database. Полный лор в исходном JSON сохранён; 25 будущих имён отображаются отдельным редакционным списком, а не фиктивными database records.

## Структура

```text
src/app/              composition root, routes, providers, error boundary
src/config/           environment validation
src/api/              transport, endpoints, normalized errors, in-memory credentials
src/models/           canonical Character, validators, serializers
src/data/             async store, provenance policy, editorial content, fallback
src/context/          React adapters for characters/auth/Telegram
src/hooks/            subscriptions, native/back/dirty navigation helpers
src/components/       reusable presentation and interaction primitives
src/pages/            product screens
src/styles/           centralized design tokens
backend/app/          config, models, schemas, auth, routers, services, errors, seed
backend/migrations/   versioned database migrations
tests/                frontend regression tests
backend/tests/        backend contract/auth/DB tests
```

Подробнее: [ARCHITECTURE.md](ARCHITECTURE.md), [API.md](API.md), [DECISIONS.md](DECISIONS.md). Исходные findings и порядок работ — [OVERHAUL_PLAN.md](OVERHAUL_PLAN.md), результаты проверок — [OVERHAUL_REPORT.md](OVERHAUL_REPORT.md).

## Deployment

Frontend и backend этого overhaul выпускаются согласованно: новый клиент требует `version` в ответах, новый сервер требует подписанную auth и версии записей. Не выкатывайте только frontend поверх старого API.

1. Сделайте backup существующей БД. Проверьте миграции на её копии. `python -m alembic upgrade head` принимает исходную schema, валидирует старые данные и сохраняет id/лoр. При отказе исправьте указанные старые записи осознанно; не удаляйте production database и не запускайте seed как «исправление».
2. Настройте постоянный PostgreSQL, server secrets и CORS. Production config откажется запускаться с development token, wildcard origin или SQLite. Зависимости: `python -m pip install -r requirements.txt`.
3. В отдельном release step один раз примените migrations. Для новой пустой БД seed запускается вручную с явным путём к snapshot. Worker startup никогда не меняет schema/контент.
4. Запустите backend командой `python -m uvicorn app.main:app --host 0.0.0.0 --port <PORT>`. Настройте HTTPS, readiness на `/api/health`, журнал ошибок без секретов и регулярные backups.
5. Для Netlify/Vercel/другого static host задайте `VITE_API_BASE_URL=https://<ваш-api-host>` и соответствующий `ALLOWED_ORIGINS` на backend. Затем `npm ci && npm run build`, publish directory `dist`. При same-origin hosting настройте reverse proxy `/api/*`, сохраняющий путь и auth/If-Match headers.
6. Hash links вида `/#/characters/verton` не требуют rewrite каждого frontend маршрута. Если сайт находится в подпапке, base `./` сохраняет относительные asset URLs. У HTML должны быть revalidation/no-cache headers; hashed assets можно кешировать immutable.
7. Проверьте реальный HTTPS frontend/API, OPTIONS, signed Telegram admin, create/edit/delete, перезапуск backend и сохранность данных. Development/preview server не предназначен для public production hosting.

На edge/proxy разумно ограничить размер JSON request и частоту admin requests. Не добавляйте Telegram domains в CORS вместо своего сайта: WebView использует origin размещённого frontend. Разрешайте точные preview origins отдельно при необходимости.

## Проверки

```sh
npm run lint
npm run test
npm run build
npm run check:dist
npm run preview
# Отдельно, в backend с активным venv:
python -m pytest
```

`npm run test` завершается один раз; `npm run test:watch` предназначен для разработки. Lint проверяет hooks/unused imports и границы HTTP/API/config. Tests охватывают transport/204/errors, canonical model, fallback/гонки/CRUD, формы и Telegram. Backend tests используют отдельные временные БД, а не `DATABASE_URL` production. CI запускает проверки обоих стеков.

Для preview по умолчанию `/api` требует backend proxy: можно перед сборкой выбрать отдельный backend HTTPS origin или поднять локальный reverse proxy. Vite dev proxy используется только в development. Фактический статус production Telegram/device/PostgreSQL проверок указан в отчёте; локальные mock tests не подменяют эти проверки.
