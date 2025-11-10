'use client';

import { TelegramProvider } from '@/components/TelegramProvider';

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  return <TelegramProvider>{children}</TelegramProvider>;
}
