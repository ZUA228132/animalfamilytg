export type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: TelegramUser;
        };
        ready?: () => void;
        expand?: () => void;
        close?: () => void;
        colorScheme?: 'light' | 'dark';
      };
    };
  }
}

export function getTelegramUser(): TelegramUser | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp?.initDataUnsafe?.user ?? null;
}

export function initTelegramWebApp() {
  if (typeof window === 'undefined') return;
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;
  webApp.ready?.();
  webApp.expand?.();
}
