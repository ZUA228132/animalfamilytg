'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { useRouter } from 'next/navigation';
import { useTelegramUser } from '@/components/TelegramProvider';
import { hapticImpact, hapticSuccess, hapticError, hapticWarning } from '@/lib/telegram';

const MapView = dynamic(
  () => import('@/components/MapView').then((m) => m.MapView),
  { ssr: false }
);

export default function NewListingPage() {
  const router = useRouter();
  const user = useTelegramUser();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('adoption');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    hapticImpact('medium');

    if (!user) {
      setMessage('Ошибка: Telegram-пользователь не определен.');
      hapticError();
      return;
    }
    if (!title || !city) {
      setMessage('Заполните название и город.');
      hapticWarning();
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, tg_username')
      .eq('tg_id', user.id)
      .limit(1);

    if (profileError || !profiles || profiles.length === 0) {
      console.error(profileError);
      setIsSubmitting(false);
      setMessage('Ошибка профиля пользователя.');
      hapticError();
      return;
    }

    const profile = profiles[0];

    let imageUrl: string | null = null;
    if (imageFile) {
      try {
        const path = `listing-${profile.id}-${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('listings')
          .upload(path, imageFile);

        if (uploadError) {
          console.error('Upload listing image error', uploadError);
        } else {
          const { data: publicData } = supabase.storage
            .from('listings')
            .getPublicUrl(path);
          imageUrl = publicData.publicUrl;
        }
      } catch (err) {
        console.error('Unexpected listing upload error', err);
      }
    }

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
      contact_tg_username: profile.tg_username ?? user.username ?? null,
      image_url: imageUrl
    });

    setIsSubmitting(false);

    if (error) {
      console.error(error);
      setMessage('Ошибка при создании объявления. Подробности в консоли браузера.');
      hapticError();
    } else {
      setMessage('Объявление отправлено на модерацию.');
      hapticSuccess();
      setTimeout(() => {
        router.push('/feed');
      }, 1200);
    }
  }

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
          <h1 className="text-lg font-semibold text-slate-900">Новое объявление</h1>
          <div className="w-16" />
        </div>
        <form
          className="space-y-3 rounded-3xl bg-white p-4 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="text-xs font-medium text-slate-700">Фото</label>
            <input
              type="file"
              accept="image/*"
              className="mt-1 w-full text-xs text-slate-600"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setImageFile(file);
                if (file) hapticImpact('light');
              }}
            />
          </div>
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
                placeholder="Москва"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Категория</label>
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
  );
}
