'use client';

import { ReactNode, useEffect, useState } from 'react';
import { getTelegramUser, initTelegramWebApp, TelegramUser } from '@/lib/telegram';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  children: (user: TelegramUser | null) => ReactNode;
};

export function TelegramProvider({ children }: Props) {
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

  return <>{children(user)}</>;
}
