'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { useTelegramUser } from '@/components/TelegramProvider';
import MapView from '@/components/MapView';

type NewListingForm = {
  title: string;
  description: string;
  city: string;
  price: string;
  type: string;
  status: string;
  contact_tg_username: string;
  image_url: string;
  latitude: string;
  longitude: string;
};

const DEFAULT_FORM: NewListingForm = {
  title: '',
  description: '',
  city: '',
  price: '',
  type: 'sell',
  status: 'active',
  contact_tg_username: '',
  image_url: '',
  latitude: '',
  longitude: '',
};

export const dynamic = 'force-dynamic';

export default function NewListingPage() {
  const router = useRouter();
  const telegramUser = useTelegramUser();

  const [form, setForm] = useState<NewListingForm>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Подставляем @username из Telegram, если он есть
  useEffect(() => {
    if (!telegramUser?.username) return;
    setForm((prev) => ({
      ...prev,
      contact_tg_username: telegramUser.username.startsWith('@')
        ? telegramUser.username
        : `@${telegramUser.username}`,
    }));
  }, [telegramUser?.username]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const canSubmit =
    form.title.trim().length > 2 &&
    form.type.trim().length > 0 &&
    !isSubmitting;

  const parseNumberOrNull = (value: string): number | null => {
    const v = value.replace(',', '.').trim();
    if (!v) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);

    const priceNumber = parseNumberOrNull(form.price);
    const latitudeNumber = parseNumberOrNull(form.latitude);
    const longitudeNumber = parseNumberOrNull(form.longitude);

    try {
      const { error } = await supabase.from('listings').insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        city: form.city.trim() || null,
        price: priceNumber,
        type: form.type || null,
        status: form.status || 'active',
        contact_tg_username: form.contact_tg_username.trim() || null,
        image_url: form.image_url.trim() || null,
        latitude: latitudeNumber,
        longitude: longitudeNumber,
      });

      if (error) {
        console.error('Error inserting listing:', error);
        alert('Не удалось создать объявление. Попробуйте ещё раз.');
        setIsSubmitting(false);
        return;
      }

      router.push('/feed');
    } catch (err) {
      console.error('Unexpected error inserting listing:', err);
      alert('Произошла ошибка. Попробуйте ещё раз.');
      setIsSubmitting(false);
    }
  };

  const latitudeNumber = parseNumberOrNull(form.latitude);
  const longitudeNumber = parseNumberOrNull(form.longitude);

  return (
    <main className="min-h-screen bg-slate-50 pb-6">
      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-4">
        <Header title="Новое объявление" />

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
        >
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Заголовок объявления
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none ring-0 focus:border-sky-400"
              placeholder="Например: Отдам котёнка в добрые руки"
              maxLength={120}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Описание
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none ring-0 focus:border-sky-400"
              rows={3}
              placeholder="Расскажите подробнее о питомце или услуге"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Город
              </label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none ring-0 focus:border-sky-400"
                placeholder="Например: Москва"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Цена
              </label>
              <input
                name="price"
                value={form.price}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none ring-0 focus:border-sky-400"
                placeholder="0 — если бесплатно"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Тип объявления
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none ring-0 focus:border-sky-400"
              >
                <option value="sell">Продажа</option>
                <option value="buy">Куплю</option>
                <option value="service">Услуги</option>
                <option value="lost">Потерялся</option>
                <option value="found">Нашёлся</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Статус
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none ring-0 focus:border-sky-400"
              >
                <option value="active">Активно</option>
                <option value="reserved">Забронировано</option>
                <option value="closed">Закрыто</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Контакт в Telegram
            </label>
            <input
              name="contact_tg_username"
              value={form.contact_tg_username}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none ring-0 focus:border-sky-400"
              placeholder="@username"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Фото (URL)
            </label>
            <input
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none ring-0 focus:border-sky-400"
              placeholder="https://…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Широта
              </label>
              <input
                name="latitude"
                value={form.latitude}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none ring-0 focus:border-sky-400"
                placeholder="48.12345"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Долгота
              </label>
              <input
                name="longitude"
                value={form.longitude}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none ring-0 focus:border-sky-400"
                placeholder="37.54321"
              />
            </div>
          </div>

          <MapView latitude={latitudeNumber} longitude={longitudeNumber} />

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-2 w-full rounded-full bg-emerald-500 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? 'Создаём объявление…' : 'Создать объявление'}
          </button>
        </form>

        <div className="mt-2 text-center text-[11px] text-slate-400">
          AnimalFamily • создание объявления
        </div>
      </div>
    </main>
  );
}
