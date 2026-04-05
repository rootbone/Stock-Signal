import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="relative z-10 mt-16 border-t border-[var(--border)] bg-[var(--background)]/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
            Stock Signal
          </div>
          <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
            공시, 뉴스, 이벤트 신호를 기반으로 AI 추천을 제공하는 주식 분석 서비스
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted-foreground)]">
          <Link href="/" className="transition hover:text-[var(--foreground)]">
            홈
          </Link>
          <Link
            href="/recommendations"
            className="transition hover:text-[var(--foreground)]"
          >
            추천 종목
          </Link>
          <span>© 2026 Stock Signal</span>
        </div>
      </div>
    </footer>
  );
}