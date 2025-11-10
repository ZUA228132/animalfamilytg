'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { useRouter } from 'next/navigation';
import { useTelegramUser } from '@/components/TelegramProvider';
import { hapticImpact, hapticSuccess, hapticError, hapticWarning } from '@/lib/telegram';
import MapView from '@/components/MapView';

type ProfileRow = {
  id: string;
  tg_id: number;
  tg_username: string | null;
  city: string | null;
  is_premium: boolean | null;
};

const TYPE_OPTIONS = [
  { value: 'lost', label: 'Потерялся' },
  { value: 'found', label: 'Нашёлся' },
  { value: 'adoption', label: 'Ищет дом' },
  { value: 'service', label: 'Услуги (премиум)' },
  { value: 'sale', label: 'Продажа (премиум)' }
];

export default function NewListingPage() {
  const router = useRouter();
  const tgUser = useTelegramUser();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('lost');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!tgUser) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, tg_id, tg_username, city, is_premium')
        .eq('tg_id', tgUser.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        setMessage('Ошибка загрузки профиля.');
        return;
      }
      if (data) {
        const p = data as ProfileRow;
        setProfile(p);
        if (p.city) setCity(p.city);
      }
    }
    loadProfile();
  }, [tgUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    hapticImpact('medium');

    if (!tgUser) {
      setMessage('Откройте приложение из Telegram.');
      hapticError();
      return;
    }

    if (!profile) {
      setMessage('Профиль пользователя не найден.');
      hapticError();
      return;
    }

    if (!title || !city) {
      setMessage('Заполните название и город.');
      hapticWarning();
      return;
    }

    if ((type === 'sale' || type === 'service') && !profile.is_premium) {
      setMessage('Размещать объявления о продаже и услугах могут только пользователи с премиум-подпиской. Оформите премиум в профиле.');
      hapticWarning();
      return;
    }

    setIsSubmitting(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      try {
        const path = `listing-${profile.id}-${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('listings')
          .upload(path, imageFile);

        if (uploadError) {
          console.error('Upload error', uploadError);
        } else {
          const { data: publicData } = supabase.storage
            .from('listings')
            .getPublicUrl(path);
          imageUrl = publicData.publicUrl;
        }
      } catch (err) {
        console.error('Unexpected upload error', err);
      }
    }

    const { error } = await supabase
      .from('listings')
      .insert({
        owner_id: profile.id,
        title,
        description,
        city,
        type,
        price: price ? Number(price) : null,
        lat,
        lng,
        status: 'pending',
        contact_tg_username: profile.tg_username ?? tgUser.username ?? null,
        image_url: imageUrl
      });

    setIsSubmitting(false);

    if (error) {
      console.error(error);
      setMessage('Ошибка при создании объявления.');
      hapticError();
    } else {
      setMessage('Объявление отправлено на модерацию.');
      hapticSuccess();
      setTimeout(() => {
        router.push('/feed');
      }, 1200);
    }
  }

  function handleLocationChange(latVal: number, lngVal: number) {
    setLat(latVal);
    setLng(lngVal);
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
          <h1 className="text-lg font-semibold text-slate-900">
            Новое объявление
          </h1>
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
            <label className="text-xs font-medium text-slate-700">
              Заголовок
            </label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например, «Нашёлся кот у метро...»"
              required
            />
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700">
                Категория
              </label>
              <select
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-slate-500">
                Продажа и услуги доступны только с премиум-подпиской.
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">
                Цена (для продажи/услуг)
              </label>
              <input
                type="number"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">
              Описание
            </label>
            <textarea
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff7a59]"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробно опишите ситуацию, приметы питомца, контакты и удобное время связи."
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">
              Локация на карте (опционально)
            </label>
            <div className="mt-1">
              <MapView onLocationChange={handleLocationChange} />
            </div>
          </div>

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
