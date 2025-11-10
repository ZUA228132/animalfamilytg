'use client';

import Link from 'next/link';
import { useTelegramUser } from '@/components/TelegramProvider';

export function Header() {
  const user = useTelegramUser();

  const profileHref = user?.username
    ? `https://t.me/${user.username}`
    : undefined;

  return (
    <header className="w-full border-b border-slate-200 bg-[#fdf9f5]/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#ffe2cf] text-sm font-bold text-[#ff7a59]">
              AF
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wide text-slate-900">
                Animal Family
              </span>
              <span className="text-xs text-slate-500">
                Твоя уютная сеть владельцев питомцев
              </span>
            </div>
          </Link>
        </div>
        {user && (
          <button
            type="button"
            onClick={() => {
              if (profileHref) {
                window.open(profileHref, '_blank');
              }
            }}
            className="flex items-center gap-2 rounded-full px-2 py-1 text-left transition hover:bg-slate-100 active:scale-[0.98]"
          >
            {user.photo_url && (
              <img
                src={user.photo_url}
                alt="avatar"
                className="h-8 w-8 rounded-full border border-white shadow-sm object-cover"
              />
            )}
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-xs font-medium">
                {user.first_name} {user.last_name}
              </span>
              {user.username && (
                <span className="text-[11px] text-slate-500">@{user.username}</span>
              )}
            </div>
          </button>
        )}
      </div>
    </header>
  );
}
