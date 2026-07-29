// Базовый URL FastAPI-бэкенда.
// Локально при `npm run dev` подставляется localhost, на проде — задай
// переменную окружения VITE_API_BASE_URL в настройках Netlify
// (Site configuration → Environment variables) со значением адреса
// твоего задеплоенного бэкенда, например https://npm-wiki-api.onrender.com
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Telegram ID администратора(ов), которым доступна админ-панель.
// Узнать свой ID можно у бота @userinfobot в Telegram.
// ВАЖНО: это же значение должно совпадать с ADMIN_IDS в backend/app/auth.py —
// проверка на фронтенде нужна только чтобы показать/скрыть кнопки,
// а настоящая защита данных происходит на сервере.
export const ADMIN_ID = 123456789
