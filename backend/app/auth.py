"""
Простая проверка админ-доступа по Telegram ID.

Фронтенд на каждый POST/PUT/DELETE запрос кладёт заголовок
`X-Telegram-User-Id` со значением window.Telegram.WebApp.initDataUnsafe.user.id.
Мы сверяем его со списком разрешённых ID.

ВАЖНО: это базовая защита для мини-приложения, а не полноценная
криптографическая аутентификация. Для продакшена с реальными деньгами/данными
стоит дополнительно проверять `initData` подписью бота (HMAC-SHA256),
но для админ-панели фан-вики такого уровня достаточно.
"""
from fastapi import Header, HTTPException, status

# Впиши сюда свой Telegram ID (число, которое видно например в @userinfobot).
# Можно перечислить несколько через запятую.
ADMIN_IDS = {
    1510369013,  # <-- замени на свой реальный Telegram ID
}


def require_admin(x_telegram_user_id: str | None = Header(default=None)):
    """
    Dependency для защищённых эндпоинтов.
    Бросает 401, если заголовок отсутствует или ID не входит в список админов.
    """
    if x_telegram_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Отсутствует заголовок X-Telegram-User-Id",
        )

    try:
        user_id = int(x_telegram_user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Некорректный Telegram ID",
        )

    if user_id not in ADMIN_IDS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещён: недостаточно прав администратора",
        )

    return user_id
