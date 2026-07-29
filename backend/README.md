# НПМ Фандом Вики — бэкенд (FastAPI + SQLite)

Бэкенд для динамического управления персонажами через админ-панель.

## Локальный запуск

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

При первом запуске автоматически создастся файл `npm_wiki.db` (SQLite) и заполнится
данными из `../src/data/wiki_data.json`.

Проверить, что всё работает: открой в браузере **http://localhost:8000/api/characters** —
должен вернуться JSON со всеми персонажами. Интерактивная документация API доступна на
**http://localhost:8000/docs**.

## Настройка админа

Открой `backend/app/auth.py` и впиши свой Telegram ID в `ADMIN_IDS`:

```python
ADMIN_IDS = {
    123456789,  # <-- твой Telegram ID
}
```

Узнать свой ID можно у бота **@userinfobot** в Telegram.

**Важно:** такой же ID нужно указать в `src/config.js` на фронтенде, в константе `ADMIN_ID` —
иначе кнопки админки не появятся в интерфейсе (хотя сервер и так отклонит запросы от чужого ID).

## Структура

```
backend/
  app/
    main.py       # точка входа, все API-эндпоинты
    models.py     # SQLAlchemy-модели таблиц characters и appearances
    schemas.py    # Pydantic-схемы для валидации запросов/ответов
    crud.py       # функции чтения/записи в базу
    database.py   # подключение к SQLite
    auth.py       # проверка Telegram ID администратора
    seed.py       # первичное заполнение базы из wiki_data.json
  requirements.txt
```

## API

| Метод  | Путь                      | Доступ       | Описание                          |
|--------|---------------------------|--------------|------------------------------------|
| GET    | `/api/characters`         | публичный    | список всех персонажей             |
| GET    | `/api/characters/{id}`    | публичный    | один персонаж                      |
| POST   | `/api/characters`         | админ        | создать персонажа                  |
| PUT    | `/api/characters/{id}`    | админ        | обновить персонажа                 |
| DELETE | `/api/characters/{id}`    | админ        | удалить персонажа                  |

Для админских запросов фронтенд передаёт заголовок `X-Telegram-User-Id` со значением
`window.Telegram.WebApp.initDataUnsafe.user.id`. Сервер сверяет его со списком `ADMIN_IDS`.

## Деплой бэкенда

SQLite-файл живёт на диске сервера, поэтому нужен хостинг с постоянным диском
(не serverless-функции). Проще всего — **Render.com** (бесплатный план):

1. Зайди на render.com → New → Web Service → подключи свой GitHub-репозиторий
2. Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Задеплой — Render даст ссылку вида `https://npm-wiki-api.onrender.com`

После этого:
- в `backend/app/main.py` замени `allow_origins=["*"]` на точный адрес твоего Netlify-сайта
- в Netlify (Site configuration → Environment variables) добавь переменную
  `VITE_API_BASE_URL` со значением адреса бэкенда с Render
- пересобери фронтенд (`git push` — Netlify пересоберёт сам)

Если бэкенд недоступен (не задеплоен или временно не отвечает), приложение автоматически
покажет персонажей из локального `wiki_data.json`, чтобы сайт не оставался пустым —
но добавление/редактирование/удаление в этом случае работать не будет.
