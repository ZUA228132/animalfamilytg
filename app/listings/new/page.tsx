'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { TelegramProvider } from '@/components/TelegramProvider';
import { Header } from '@/components/Header';
import { MapView } from '@/components/MapView';
import { useRouter } from 'next/navigation';

export default function NewListingPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('adoption');
  const [price, setPrice] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(tgUser: any | null, e: React.FormEvent) {
    e.preventDefault();
    if (!tgUser) {
      setMessage('Ошибка: Telegram-пользователь не определен.');
      return;
    }
    if (!title || !city) {
      setMessage('Заполните название и город.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    // Получаем профиль по tg_id
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, tg_username')
      .eq('tg_id', tgUser.id)
      .limit(1);

    if (profileError || !profiles || profiles.length === 0) {
      setIsSubmitting(false);
      setMessage('Ошибка профиля пользователя.');
      return;
    }

    const profile = profiles[0];

    const { error } = await supabase.from('listings').insert({
      owner_id: profile.id,
      title,
      description,
      city,
      type,
      price: price ? Number(price) : null,
      lat,
      lng,
      status: 'pending',
      contact_tg_username: profile.tg_username ?? tgUser.username ?? null
    });

    setIsSubmitting(false);

    if (error) {
      console.error(error);
      setMessage('Ошибка при создании объявления.');
    } else {
      setMessage('Объявление отправлено на модерацию.');
      setTimeout(() => {
        router.push('/feed');
      }, 1200);
    }
  }

  return (
    <TelegramProvider>
      {(user) => (
        <div className="min-h-screen bg-[#f9f4f0]">
          <Header user={user} />
          <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">
            <h1 className="mb-3 text-lg font-semibold text-slate-900">Новое объявление</h1>
            <form
              className="space-y-3 rounded-3xl bg-white p-4 shadow-sm"
              onSubmit={(e) => handleSubmit(user, e)}
            >
              <div>
                <label className="text-xs font-medium text-slate-700">Заголовок</label>
                <input
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Щенок ищет дом"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Описание</label>
                <textarea
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Коротко опишите питомца или ситуацию."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Город</label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Киев"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Тип</label>
                  <select
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="lost">Потерялся</option>
                    <option value="found">Нашёлся</option>
                    <option value="adoption">Ищет дом</option>
                    <option value="service">Услуги</option>
                    <option value="sale">Продажа</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Цена (опционально)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>

              <MapView
                onLocationChange={(latitude, longitude) => {
                  setLat(latitude);
                  setLng(longitude);
                }}
              />

              {message && (
                <p className="text-xs text-slate-700">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
              >
                {isSubmitting ? 'Сохраняем…' : 'Создать объявление'}
              </button>
            </form>
          </main>
        </div>
      )}
    </TelegramProvider>
  );
}
