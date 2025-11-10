'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { useTelegramUser } from '@/components/TelegramProvider';
import { hapticImpact, hapticSuccess, hapticError } from '@/lib/telegram';

type PublicProfile = {
  id: string;
  full_name: string | null;
  tg_username: string | null;
  avatar_url: string | null;
  city: string | null;
  is_business: boolean | null;
  business_name: string | null;
};

type ReviewRow = {
  id: string;
  rating: number;
  text: string | null;
  created_at: string;
  author_profile_id: string | null;
  author_full_name: string | null;
  author_tg_username: string | null;
};

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const tgUser = useTelegramUser();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const id = params?.id as string | undefined;
      if (!id) {
        setLoading(false);
        return;
      }

      // Профиль
      const { data: p, error: pErr } = await supabase
        .from('profiles')
        .select(
          'id, full_name, tg_username, avatar_url, city, is_business, business_name'
        )
        .eq('id', id)
        .maybeSingle();

      if (pErr) {
        console.error(pErr);
      }

      if (!p) {
        setLoading(false);
        return;
      }

      setProfile(p as any);

      // Отзывы
      const { data: r, error: rErr } = await supabase
        .from('user_reviews')
        .select(
          'id, rating, text, created_at, author_profile_id, author:author_profile_id(full_name, tg_username)'
        )
        .eq('target_profile_id', id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (rErr) {
        console.error(rErr);
      } else if (r) {
        const mapped: ReviewRow[] = r.map((row: any) => ({
          id: row.id,
          rating: row.rating,
          text: row.text,
          created_at: row.created_at,
          author_profile_id: row.author_profile_id,
          author_full_name: row.author?.full_name ?? null,
          author_tg_username: row.author?.tg_username ?? null,
        }));
        setReviews(mapped);
      }

      setLoading(false);
    }

    load();
  }, [params]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return null;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!tgUser) {
      setMessage('Чтобы оставить отзыв, откройте Animal Family как WebApp из Telegram.');
      hapticError();
      return;
    }
    if (!profile) return;
    if (!reviewText.trim()) {
      setMessage('Напишите, пожалуйста, пару слов в отзыве.');
      hapticImpact('light');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    hapticImpact('medium');

    try {
      // Находим или создаём профиль автора по tg_id
      const { data: author, error: aErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('tg_id', tgUser.id)
        .maybeSingle();

      if (aErr || !author) {
        console.error(aErr);
        setMessage('Не удалось определить ваш профиль для отзыва.');
        hapticError();
        setSubmitting(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_reviews')
        .insert({
          target_profile_id: profile.id,
          author_profile_id: author.id,
          rating: reviewRating,
          text: reviewText.trim(),
        })
        .select('id, created_at')
        .single();

      if (error) {
        console.error(error);
        setMessage('Не удалось сохранить отзыв. Попробуйте позже.');
        hapticError();
      } else {
        const newReview: ReviewRow = {
          id: data.id,
          rating: reviewRating,
          text: reviewText.trim(),
          created_at: data.created_at,
          author_profile_id: author.id,
          author_full_name: tgUser.first_name || null,
          author_tg_username: tgUser.username || null,
        };
        setReviews((prev) => [newReview, ...prev]);
        setReviewText('');
        setReviewRating(5);
        setMessage('Отзыв сохранён.');
        hapticSuccess();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const displayName =
    profile?.business_name ||
    profile?.full_name ||
    (profile?.tg_username ? `@${profile.tg_username}` : 'Профиль пользователя');

  return (
    <div className="min-h-screen bg-[#f9f4f0]">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">
        <button
          type="button"
          onClick={() => {
            hapticImpact('light');
            router.back();
          }}
          className="mb-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
        >
          ← Назад
        </button>

        {loading && <p className="text-xs text-slate-500">Загрузка…</p>}

        {!loading && !profile && (
          <p className="text-xs text-slate-500">Профиль не найден.</p>
        )}

        {!loading && profile && (
          <div className="space-y-4">
            <section className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ffe2cf] text-xl font-semibold text-[#ff7a59]">
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-semibold text-slate-900">
                      {displayName}
                    </h1>
                    {profile.is_business && (
                      <span className="inline-flex items-center rounded-full bg-[#e0ecff] px-2 py-0.5 text-[10px] font-medium text-slate-900">
                        Бизнес-профиль
                      </span>
                    )}
                  </div>
                  {profile.city && (
                    <p className="text-xs text-slate-500">{profile.city}</p>
                  )}
                  {profile.tg_username && (
                    <a
                      href={`https://t.me/${profile.tg_username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 text-[11px] font-medium text-[#ff7a59]"
                    >
                      Написать в Telegram
                    </a>
                  )}
                  {avgRating && (
                    <p className="mt-1 text-[11px] text-slate-700">
                      Рейтинг: <span className="font-semibold">{avgRating.toFixed(1)}</span>{' '}
                      из 5 ({reviews.length} отзывов)
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Отзывы</h2>
              {reviews.length === 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Пока нет отзывов. Станьте первым, кто поделится своим опытом.
                </p>
              )}
              {reviews.length > 0 && (
                <ul className="mt-2 space-y-2 text-xs text-slate-700">
                  {reviews.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-2xl bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold">
                            {'★'.repeat(r.rating)}{' '}
                            <span className="text-slate-400">
                              {'★'.repeat(5 - r.rating)}
                            </span>
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {r.author_full_name ||
                              (r.author_tg_username
                                ? `@${r.author_tg_username}`
                                : 'Пользователь')}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(r.created_at).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      {r.text && (
                        <p className="mt-1 whitespace-pre-line">{r.text}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-3xl bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Оставить отзыв
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Отзывы видят другие пользователи Animal Family. Пишите уважительно и по делу.
              </p>

              <form
                onSubmit={handleSubmitReview}
                className="mt-2 space-y-2 text-xs"
              >
                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Оценка
                  </label>
                  <div className="mt-1 flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          setReviewRating(star);
                          hapticImpact('light');
                        }}
                        className={
                          'flex h-7 w-7 items-center justify-center rounded-full border text-sm ' +
                          (star <= reviewRating
                            ? 'border-[#ff7a59] bg-[#ffe2cf] text-[#ff7a59]'
                            : 'border-slate-200 bg-slate-50 text-slate-400')
                        }
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Отзыв
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-[#ff7a59]"
                    rows={3}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Напишите, как прошёл ваш опыт общения или сделки."
                  />
                </div>
                {message && (
                  <p className="text-[11px] text-slate-600">{message}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
                >
                  {submitting ? 'Сохраняем…' : 'Отправить отзыв'}
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
