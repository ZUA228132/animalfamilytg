'use client';

import { ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { getTelegramUser, initTelegramWebApp, TelegramUser } from '@/lib/telegram';
import { supabase } from '@/lib/supabaseClient';

const TelegramUserContext = createContext<TelegramUser | null>(null);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    initTelegramWebApp();
    const tgUser = getTelegramUser();
    setUser(tgUser);

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
  }, []);

  return (
    <TelegramUserContext.Provider value={user}>
      {children}
    </TelegramUserContext.Provider>
  );
}

export function useTelegramUser() {
  return useContext(TelegramUserContext);
}
