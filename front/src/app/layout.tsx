import "./globals.css";
import type { Metadata } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-en",
  display: "swap",
});

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-sans-kr",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stock Signal",
  description: "호재 데이터 수집 및 AI 추천 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${inter.variable} ${notoSansKr.variable}`}
    >
      <body className="min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)] antialiased">
        <ThemeProvider>
          <div className="relative flex min-h-screen flex-col bg-[var(--background)]">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="absolute right-0 top-24 h-[280px] w-[280px] rounded-full bg-cyan-400/10 blur-3xl" />
            </div>

            <AppHeader />

            <main className="relative z-10 flex-1 pt-20">{children}</main>

            <AppFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}