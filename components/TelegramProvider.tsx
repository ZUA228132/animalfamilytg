'use client';

import { ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { getTelegramUser, initTelegramWebApp, TelegramUser } from '@/lib/telegram';
import { supabase } from '@/lib/supabaseClient';

const TelegramUserContext = createContext<TelegramUser | null>(null);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [ready, setReady] = useState(false);
  const [petName, setPetName] = useState<string | null>(null);

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
  
  useEffect(() => {
    async function loadPetName() {
      try {
        const tgUser = getTelegramUser();
        if (!tgUser) return;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('tg_id', tgUser.id)
          .maybeSingle();

        if (profileError || !profile) return;

        const { data: passport, error: passportError } = await supabase
          .from('pet_passports')
          .select('name')
          .eq('owner_id', profile.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!passportError && passport && passport.name) {
          setPetName(passport.name);
        }
      } catch (e) {
        // тихо игнорируем
      }
    }

    loadPetName();
  }, []);
}, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[url('/fon.png')] bg-cover bg-center">
        <div className="flex h-screen w-full items-center justify-center bg-[#f9f4f0]/85">
        <div className="animate-[fadeInUp_0.4s_ease-out] rounded-3xl bg-white/95 px-7 py-6 shadow-md">
          <style jsx global>{`
            @keyframes fadeInUp {
              0% {
                opacity: 0;
                transform: translateY(8px) scale(0.98);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>
          <div className="flex items-center gap-4">
            {user?.photo_url ? (
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ffb899] to-[#ff7a59] opacity-60 blur-[4px]" />
                <img
                  src={user.photo_url}
                  alt="avatar"
                  className="relative h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffe2cf] text-sm font-semibold text-[#ff7a59]">
                AF
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">
                {user?.first_name ? `Привет, ${user.first_name}!` : 'Привет!'}
              </span>
              <span className="mt-1 text-xs text-slate-500">
                Загружаем твою Animal Family…
              </span>
              {petName && (
                <span className="mt-1 text-[11px] text-slate-500">
                  И {petName} тоже большой привет)
                </span>
              )}
            </div>
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
