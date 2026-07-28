# НПМ Фандом Вики — Telegram Mini App

Стильная фанатская вики-энциклопедия по сериалу «NPM» в киберпанк-эстетике, сделанная как Telegram Mini App: React + Vite + Tailwind CSS.

## Стек

- **React 18** + **React Router 6** (HashRouter — обязателен для Telegram WebView, чтобы работали прямые ссылки на персонажей)
- **Vite 5** — сборка и dev-сервер
- **Tailwind CSS 3** — вся стилизация, кастомные neon-токены под лор персонажей
- **lucide-react** — иконки
- Telegram Web App SDK (`telegram-web-app.js`) подключён в `index.html`

## Быстрый старт

```bash
npm install
npm run dev       # локальная разработка, http://localhost:5173
npm run build      # продакшн-сборка в /dist
npm run preview    # предпросмотр сборки
```

## Структура проекта

```
src/
  components/       # переиспользуемые UI-блоки (Layout, BottomNav, StatusBadge, CharacterCard...)
  pages/            # экраны: Dashboard, CharacterList, CharacterProfile, Timeline, Arcs
  data/
    wiki_data.json  # весь лор персонажей на русском (редактируйте здесь, чтобы добавить героя)
  hooks/
    useTelegram.js  # обёртка над window.Telegram.WebApp (ready/expand/haptics)
  utils/
    theme.js        # явные карты Tailwind-классов по цвету персонажа (Вертон/Кьюзеро/Кортекс/Тертон)
```

## Добавление нового персонажа

1. Откройте `src/data/wiki_data.json` и добавьте объект в массив `characters` (следуйте существующей схеме полей).
2. Если у персонажа новый цвет — добавьте его палитру в `tailwind.config.js` (`theme.extend.colors`) и в карту `THEME` в `src/utils/theme.js`.

## Деплой как Telegram Mini App

1. Соберите статику: `npm run build` → папка `dist/`.
2. Захостите `dist/` на любом статическом хостинге с HTTPS (Vercel, Netlify, GitHub Pages, Cloudflare Pages).
3. В [@BotFather](https://t.me/BotFather) выполните `/newapp` (или `/setmenubutton` для существующего бота) и укажите URL вашего хостинга.
4. Приложение автоматически подхватит тему и безопасные отступы через Telegram Web App SDK, подключённый в `index.html`.

## Дизайн-система

- Тёмная база: `zinc/slate`-подобная кастомная палитра `base-950…base-600`.
- Неоновые акценты по персонажам:
  - 🟢 **Вертон** — зелёный (`verton`)
  - 🔵 **Кьюзеро** — неоновый синий (`qzero`)
  - 🟣 **Кортекс** — фиолетовый (`cortex`)
  - ⚪ **Тертон** — призрачно-серый (`terton`)
- Статус-бейджи анимированы по смыслу: `Жив/Жива` — мягкое мигание зелёным, `Связь потеряна` — тревожное мерцание, `Неизвестно` — медленная пульсация.
- Шрифты: `Rajdhani`/`Orbitron` для заголовков (дисплейный, игровой), `Inter` для основного текста, `JetBrains Mono` для лейблов и мета-данных.
