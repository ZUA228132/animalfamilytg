import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';
import ClientRoot from './ClientRoot';

export const metadata: Metadata = {
  title: 'Animal Family',
  description: 'Соц-сеть для владельцев животных внутри Telegram WebApp',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-[#f9f4f0] text-slate-800">
        <div className="relative min-h-screen">
          {/* Фиксированная надпись под монобровью / островком */}
          <div
            className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <div className="mt-1 rounded-full bg-black/60 px-4 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur">
              Animal Family
            </div>
          </div>

          {/* Основной контент чуть ниже, чтобы не прятаться под монобровью */}
          <div
            className="pt-6"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 40px)' }}
          >
            <ClientRoot>{children}</ClientRoot>
          </div>
        </div>
      </body>
    </html>
  );
}
