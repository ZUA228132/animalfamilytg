'use client';

import { useEffect, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { useTelegramUser } from '@/components/TelegramProvider';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  hapticImpact,
  hapticSuccess,
  hapticError,
  hapticWarning,
} from '@/lib/telegram';

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

let msgCounter = 1;

export default function VetPage() {
  const tgUser = useTelegramUser();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadProfile() {
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
    loadProfile();
  }, [tgUser]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) {
      hapticWarning();
      return;
    }
    if (isThinking) return;

    const text = question.trim();
    setQuestion('');
    hapticImpact('medium');

    const userMsg: ChatMessage = {
      id: msgCounter++,
      from: 'user',
      text,
    };
    setMessages((prev) => [...prev, userMsg]);

    setIsThinking(true);
    setErrorText(null);

    try {
      const res = await fetch('/api/vet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.error('Vet API error', data);
        throw new Error(data?.error || 'Ошибка ИИ-ветеринара');
      }

      const data = await res.json();
      const answer: string =
        data.answer ||
        'Извините, что-то пошло не так. Попробуйте ещё раз чуть позже.';

      const stepanMsg: ChatMessage = {
        id: msgCounter++,
        from: 'stepan',
        text: answer,
      };
      setMessages((prev) => [...prev, stepanMsg]);
      hapticSuccess();
    } catch (err) {
      console.error(err);
      setErrorText(
        'Не удалось получить ответ от Степана. Попробуйте ещё раз позже.'
      );
      hapticError();
    } finally {
      setIsThinking(false);
    }
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
          <p className="text-xs text-slate-500">Загружаем данные…</p>
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
              ИИ-ветеринар Степан доступен владельцам премиум-подписки Animal
              Family. Подписка открывает чат со Степаном и даёт возможность
              размещать объявления о продаже и услугах.
            </p>
            <p className="mt-2 text-[11px] text-slate-600">
              Ответы Степана носят рекомендательный характер и не заменяют очный
              приём у ветеринарного врача.
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
          <section className="flex h-[calc(100vh-170px)] flex-col rounded-3xl bg-white p-4 shadow-sm">
            {/* Шапка чата как в мессенджере */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e0ecff] text-lg">
                🐾
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900">
                  Степан
                </span>
                <span className="text-[11px] text-emerald-500">
                  онлайн
                </span>
              </div>
            </div>

            {/* Лента сообщений */}
            <div
              ref={scrollRef}
              className="mt-3 flex-1 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 p-2"
            >
              {messages.length === 0 && !isThinking && (
                <div className="mx-auto max-w-[80%] rounded-2xl bg-white px-3 py-2 text-[11px] text-slate-500">
                  Задайте первый вопрос Степану. Например: «Собаке 5 лет,
                  начала хромать на заднюю лапу. Что можно сделать до визита в
                  клинику?».
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.from === 'user' ? 'flex justify-end' : 'flex justify-start'
                  }
                >
                  <div className="flex max-w-[80%] items-end gap-2">
                    {m.from === 'stepan' && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e0ecff] text-xs">
                        🐾
                      </div>
                    )}
                    <div
                      className={
                        m.from === 'user'
                          ? 'rounded-2xl bg-slate-900 px-3 py-2 text-[11px] text-white'
                          : 'rounded-2xl bg-white px-3 py-2 text-[11px] text-slate-800'
                      }
                    >
                      {m.text.split('\n').map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="flex max-w-[70%] items-center gap-2 rounded-2xl bg-white px-3 py-2 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                      <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.12s]" />
                      <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.24s]" />
                    </div>
                    <span>Степан думает…</span>
                  </div>
                </div>
              )}
            </div>

            {/* Поле ввода как в чатах */}
            <form
              onSubmit={handleSend}
              className="mt-3 flex items-end gap-2 border-t border-slate-100 pt-3"
            >
              <textarea
                className="max-h-24 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-[#ff7a59]"
                rows={2}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Напишите сообщение Степану…"
                disabled={isThinking}
              />
              <button
                type="submit"
                disabled={isThinking}
                className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900 px-4 text-[11px] font-medium text-white disabled:opacity-60"
              >
                Отправить
              </button>
            </form>

            <p className="mt-2 text-[10px] leading-snug text-slate-500">
              Важно: ответы Степана носят рекомендательный характер и не
              заменяют очный приём у ветеринарного врача. При любых сомнениях
              обращайтесь в клинику.
            </p>

            {errorText && (
              <p className="mt-1 text-[11px] text-rose-500">{errorText}</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
