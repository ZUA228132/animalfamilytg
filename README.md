# Animal Family – Telegram WebApp для владельцев животных

Готовый минимальный продакшн-проект на Next.js + Supabase под Telegram WebApp.

## Запуск локально

1. Установи зависимости:

```bash
npm install
```

2. Создай `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3. В Supabase выполни SQL из файла `schema.sql` (создай сам по инструкции из чата: profiles, pet_passports, listings, alerts, ad_banner, tgs_animations).

4. Запусти:

```bash
npm run dev
```

5. Подключи этот URL как WebApp у Telegram-бота (через BotFather).

## Деплой

1. Залей проект на GitHub.
2. Подключи к Vercel.
3. В Vercel задай те же переменные окружения.
