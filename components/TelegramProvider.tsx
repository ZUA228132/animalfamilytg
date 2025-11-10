'use client';

import { ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { getTelegramUser, initTelegramWebApp, TelegramUser } from '@/lib/telegram';
import { supabase } from '@/lib/supabaseClient';

const TelegramUserContext = createContext<TelegramUser | null>(null);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initTelegramWebApp();
    const tgUser = getTelegramUser();
    setUser(tgUser ?? null);

    if (tgUser) {
      supabase
        .from('profiles')
        .upsert(
          {
            tg_id: tgUser.id,
            tg_username: tgUser.username ?? null,
            full_name: `${tgUser.first_name ?? ''} ${tgUser.last_name ?? ''}`.trim(),
            avatar_url: tgUser.photo_url ?? null
          },
          { onConflict: 'tg_id' }
        )
        .then();
    }

    const timeout = setTimeout(() => {
      setReady(true);
    }, 900);

    return () => clearTimeout(timeout);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f9f4f0]">
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/95 px-6 py-5 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff7a59] border-t-transparent" />
          <div className="text-sm font-semibold text-slate-900">
            {user?.first_name ? `Привет, ${user.first_name}!` : 'Привет!'}
          </div>
          <div className="text-xs text-slate-500">
            Загружаем твою Animal Family…
          </div>
        </div>
      </div>
    );
  }

  return (
    <TelegramUserContext.Provider value={user}>
      {children}
    </TelegramUserContext.Provider>
  );
}

export function useTelegramUser() {
  return useContext(TelegramUserContext);
}
