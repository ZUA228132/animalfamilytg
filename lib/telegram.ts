// lib/telegram.ts

type TgWebApp = {
  HapticFeedback?: {
    impactOccurred?: (style: 'light' | 'medium' | 'heavy') => void;
    notificationOccurred?: (type: 'success' | 'error' | 'warning') => void;
  };
  MainButton?: {
    text: string;
    show: () => void;
    hide: () => void;
    setParams?: (params: Record<string, any>) => void;
  };
  ready?: () => void;
  close?: () => void;
};

// Безопасно получаем Telegram.WebApp и НЕ трогаем window на сервере
function getTelegramWebApp(): TgWebApp | null {
  if (typeof window === 'undefined') return null;
  const anyWindow = window as any;
  return anyWindow.Telegram?.WebApp ?? null;
}

export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  const tg = getTelegramWebApp();
  try {
    tg?.HapticFeedback?.impactOccurred?.(style);
  } catch {
    // гасим любые ошибки, чтобы не ломать приложение
  }
}

export function hapticSuccess() {
  const tg = getTelegramWebApp();
  try {
    tg?.HapticFeedback?.notificationOccurred?.('success');
  } catch {
    //
  }
}

export function hapticError() {
  const tg = getTelegramWebApp();
  try {
    tg?.HapticFeedback?.notificationOccurred?.('error');
  } catch {
    //
  }
}

export function hapticWarning() {
  const tg = getTelegramWebApp();
  try {
    tg?.HapticFeedback?.notificationOccurred?.('warning');
  } catch {
    //
  }
}

// Опционально, если где-то пригодится
export function closeWebApp() {
  const tg = getTelegramWebApp();
  try {
    tg?.close?.();
  } catch {
    //
  }
}
