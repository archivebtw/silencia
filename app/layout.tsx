import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Silencia — вся музыка в одном месте",
  description: "Silencia объединяет поиск музыки и ссылки из разных музыкальных сервисов в одном интерфейсе"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
