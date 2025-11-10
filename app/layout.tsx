import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';
import ClientRoot from './ClientRoot';

export const metadata: Metadata = {
  title: 'Animal Family',
  description: 'Соц-сеть для владельцев животных внутри Telegram WebApp'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className="bg-[#f9f4f0] text-slate-800">
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
