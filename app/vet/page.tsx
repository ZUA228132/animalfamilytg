'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useTelegramUser } from '@/components/TelegramProvider';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { hapticImpact, hapticSuccess, hapticError, hapticWarning } from '@/lib/telegram';

type ProfileRow = {
  id: string;
  tg_id: number;
  is_premium: boolean | null;
};

type ChatMessage = {
  id: number;
  from: 'user' | 'stepan';
  text: string;
};

let msgIdCounter = 1;

export default function VetPage() {
  const tgUser = useTelegramUser();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!tgUser) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, tg_id, is_premium')
        .eq('tg_id', tgUser.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        setErrorText('Не удалось загрузить профиль.');
      } else if (data) {
        setProfile(data as any);
      }
      setLoading(false);
    }
    load();
  }, [tgUser]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) {
      hapticWarning();
      return;
    }
    const text = question.trim();
    setQuestion('');
    hapticImpact('medium');

    setMessages((prev) => [
      ...prev,
      { id: msgIdCounter++, from: 'user', text }
    ]);

    // Простая имитация ответа Степана без внешнего ИИ.
    const reply =
      'Привет, я Степан — ИИ-ветеринар. Я не заменяю очный приём, но помогу сориентироваться.\n\n' +
      'По твоему описанию я бы рекомендовал:\n' +
      '• внимательно следить за общим состоянием питомца;\n' +
      '• при любом ухудшении — срочно обратиться в ближайшую ветклинику;\n' +
      '• не заниматься самолечением без консультации специалиста.\n\n' +
      'Ответ носит рекомендательный характер. Обязательно покажите питомца живому ветеринару.';

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: msgIdCounter++, from: 'stepan', text: reply }
      ]);
      hapticSuccess();
    }, 400);
  }

  const isPremium = !!profile?.is_premium;

  return (
    <div className="min-h-screen bg-[#f9f4f0]">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              hapticImpact('light');
              router.back();
            }}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
          >
            ← Назад
          </button>
          <h1 className="text-lg font-semibold text-slate-900">
            Степан — ИИ-ветеринар
          </h1>
          <div className="w-16" />
        </div>

        {loading && (
          <p className="text-xs text-slate-500">Загрузка…</p>
        )}

        {!loading && !tgUser && (
          <p className="text-xs text-slate-500">
            Откройте приложение из Telegram, чтобы пользоваться чатами Animal Family.
          </p>
        )}

        {!loading && tgUser && !isPremium && (
          <section className="rounded-3xl bg-white p-4 shadow-sm text-xs text-slate-700">
            <h2 className="text-sm font-semibold text-slate-900">
              Доступ к Степану только по премиум-подписке
            </h2>
            <p className="mt-2">
              ИИ-ветеринар Степан доступен владельцам премиум-подписки Animal Family. Подписка открывает чат
              со Степаном и даёт возможность размещать объявления о продаже и услугах.
            </p>
            <p className="mt-2 text-[11px] text-slate-600">
              Ответы Степана носят рекомендательный характер и не заменяют очный приём у ветеринарного врача.
            </p>
            {errorText && (
              <p className="mt-2 text-[11px] text-rose-500">{errorText}</p>
            )}
            <button
              type="button"
              onClick={() => {
                hapticImpact('medium');
                router.push('/profile');
              }}
              className="mt-3 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-[11px] font-medium text-white"
            >
              Оформить премиум за 299 ₽
            </button>
          </section>
        )}

        {!loading && tgUser && isPremium && (
          <section className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm text-xs text-slate-700">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e0ecff] text-lg">
                🐾
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Чат с ИИ-ветеринаром Степаном
                </h2>
                <p className="mt-1 text-[11px] text-slate-600">
                  Опишите проблему как можно подробнее: возраст, порода, симптомы, чем кормите, что уже
                  предпринимали. Чем больше деталей — тем полезнее рекомендация.
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Важно: Степан не ставит диагнозы и не заменяет очный приём у ветеринарного врача. Всегда
                  консультируйтесь с живым специалистом.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-3">
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl bg-white p-2">
                {messages.length === 0 && (
                  <p className="text-[11px] text-slate-500">
                    Задайте первый вопрос Степану. Например: «Котёнку 3 месяца, отказывается от корма и
                    вялый. Что делать до визита к врачу?».
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      m.from === 'user'
                        ? 'flex justify-end'
                        : 'flex justify-start'
                    }
                  >
                    <div
                      className={
                        m.from === 'user'
                          ? 'max-w-[80%] rounded-2xl bg-slate-900 px-3 py-2 text-[11px] text-white'
                          : 'max-w-[80%] rounded-2xl bg-slate-100 px-3 py-2 text-[11px] text-slate-800'
                      }
                    >
                      {m.text.split('\n').map((line, idx) => (
                        <p key={idx}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSend} className="flex gap-2">
                <textarea
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#ff7a59]"
                  rows={2}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Опишите, что случилось с питомцем…"
                />
                <button
                  type="submit"
                  className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2 text-[11px] font-medium text-white"
                >
                  Отправить
                </button>
              </form>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
