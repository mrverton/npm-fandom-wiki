# Architectural decisions

## ADR-001: сохранить продукт и основной стек

React, JavaScript, Tailwind и FastAPI/SQLAlchemy сохраняются. Большая TypeScript миграция и новая state library не устраняли бы первопричины. Runtime contracts находятся на единственной границе API, state engine мал и проверяется без React.

## ADR-002: backend является источником истины

JSON остаётся неизменённым archived snapshot и источником явного seed. Fallback никогда не становится editable и не заменяет подтверждённый API snapshot. Метаданные редакционного roadmap существуют отдельно от database characters, поэтому новый персонаж появляется сразу, а удалённый не становится фиктивной карточкой.

## ADR-003: постоянный slug и server version

Slug нельзя менять обычным редактированием: на него ссылаются опубликованные ссылки и лор. Integer id служит CRUD. Version защищает от потерянных обновлений между вкладками/администраторами; PUT и DELETE проверяют его в транзакции. Переименование URL в будущем потребует отдельной миграции с alias/redirect policy.

## ADR-004: криптографическая Telegram authentication

Публичный Telegram user ID не доказывает личность. Raw initData проверяется сервером по [алгоритму Telegram](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app). Только backend хранит BOT_TOKEN и ADMIN_IDS. Local dev token — отдельная явно включаемая серверная возможность; production fail-closed.

## ADR-005: explicit migration и seed

DDL и seed убраны из import/startup. Alembic версионирует schema, seed выполняется оператором только на пустой базе. Это сохраняет намеренно пустой каталог и избегает worker races. Перед миграцией существующей production БД нужен backup; нарушения старых данных исправляются явно, без молчаливой потери лора.

## ADR-006: hash routing с data router

Hash URL подходит существующим static hosts и Telegram links, поэтому формат ссылок сохранён. `createHashRouter` обеспечивает штатный navigation blocker. Router обновлён до исправленной версии 7 по результатам security audit: последняя ветка 6 всё ещё попадала под advisory. React остаётся 18.

## ADR-007: подтверждённые, последовательные мутации

Нет optimistic insert/delete и автоматического retry записи. Небольшая админка выигрывает от очевидного confirmed flow: submitting → server response → atomic local snapshot. Ошибка связи может означать, что сервер всё же записал данные, поэтому требуется read reconciliation. Сложный idempotency subsystem здесь пока не нужен.

## ADR-008: один Telegram lifecycle и общие UI primitives

Provider управляет SDK, событиями и cleanup один раз; публичные hooks только читают context. Приложение сохраняет тёмную cyberpunk art direction, учитывая viewport/safe-area и возможности конкретного клиента. Native dialog, common buttons/fields/async notices устраняют дублированные interaction bugs.

## ADR-009: минимальное обновление зависимостей

Обновляются уязвимые Vite/Router и связанные test/build зависимости до совместимых patched версий. React/Tailwind не переводятся на новую major без продуктовой причины. Lock фиксирует результат. Неиспользуемая multipart backend dependency удаляется.

## ADR-010: session provenance без кеша данных

Одна browser session отметка о первом успешном API чтении переживает refresh и запрещает возврат удалённых записей из JSON. Это только происхождение данных, а не второй cache/state store. При запрете sessionStorage остаётся защита до текущего reload; ограничение явно документировано.
