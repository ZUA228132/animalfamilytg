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
        HapticFeedback?: {
          impactOccurred?: (style: 'light' | 'medium' | 'heavy') => void;
          notificationOccurred?: (type: 'error' | 'success' | 'warning') => void;
        };
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

function getHaptics() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp?.HapticFeedback ?? null;
}

// Лёгкий единичный виброотклик для кликов по кнопкам
export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light') {
  try {
    const h = getHaptics();
    h?.impactOccurred?.(style);
  } catch {
    // молча игнорируем, если не поддерживается
  }
}

// Отдельные короткие шорткаты
export function hapticSuccess() {
  try {
    const h = getHaptics();
    h?.notificationOccurred?.('success');
  } catch {}
}

export function hapticError() {
  try {
    const h = getHaptics();
    h?.notificationOccurred?.('error');
  } catch {}
}

export function hapticWarning() {
  try {
    const h = getHaptics();
    h?.notificationOccurred?.('warning');
  } catch {}
}
