'use client';

import { useTelegramUser } from '@/components/TelegramProvider';

export function Header() {
  const user = useTelegramUser();

  return (
    <header className="w-full border-b border-slate-200 bg-[#fdf9f5]/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
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
        </div>
        {user && (
          <div className="flex items-center gap-2">
            {user.photo_url && (
              <img
                src={user.photo_url}
                alt="avatar"
                className="h-8 w-8 rounded-full border border-white shadow-sm"
              />
            )}
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium">
                {user.first_name} {user.last_name}
              </span>
              {user.username && (
                <span className="text-[11px] text-slate-500">@{user.username}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
