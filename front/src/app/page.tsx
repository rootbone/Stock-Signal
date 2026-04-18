import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { recommendationRepository } from "@/server/repositories/recommendation-repository";
import GenerateRecommendationsButton from "@/components/GenerateRecommendationsButton";

export const revalidate = 60;

type RecommendationEvidence = {
  analysis?: {
    summary?: string;
    positives?: string[];
    risks?: string[];
  };
  topEvents?: {
    title: string;
    summary?: string | null;
    eventType?: string;
    sourceName?: string;
    score?: number;
    publishedAt?: string;
  }[];
  metrics?: {
    totalEvents?: number;
    positiveEvents?: number;
    negativeEvents?: number;
  };
};

function asEvidence(value: Prisma.JsonValue | null): RecommendationEvidence | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as RecommendationEvidence;
}

function confidenceToPercent(confidence: number | null | undefined): number {
  if (typeof confidence !== "number" || Number.isNaN(confidence)) {
    return 0;
  }

  return Math.max(0, Math.min(100, confidence * 100));
}

function formatScore(score?: number | null) {
  return typeof score === "number" ? score.toFixed(1) : "-";
}

export default async function HomePage() {
  const recommendations = await recommendationRepository.findTopLatest(6);

  const featured = recommendations[0] ?? null;
  const secondary = recommendations.slice(1, 5);

  const featuredEvidence = featured
    ? asEvidence(featured.evidence as Prisma.JsonValue | null)
    : null;

  const totalRecommendations = recommendations.length;
  const avgConfidence =
    recommendations.length > 0
      ? Math.round(
          (recommendations.reduce((acc, item) => acc + (item.confidence ?? 0), 0) /
            recommendations.length) *
            100
        )
      : 0;

  const positiveEvents =
    recommendations.reduce((acc, item) => {
      const evidence = asEvidence(item.evidence as Prisma.JsonValue | null);
      return acc + (evidence?.metrics?.positiveEvents ?? 0);
    }, 0) ?? 0;

  const topEvents = recommendations
    .flatMap((item) => {
      const evidence = asEvidence(item.evidence as Prisma.JsonValue | null);

      return (evidence?.topEvents ?? []).map((event) => ({
        stockName: item.stock.name,
        stockSymbol: item.stock.symbol,
        title: event.title,
        eventType: event.eventType ?? "EVENT",
        sourceName: event.sourceName ?? "SOURCE",
        score: event.score,
        publishedAt: event.publishedAt,
      }));
    })
    .sort((a, b) => Math.abs((b.score ?? 0)) - Math.abs((a.score ?? 0)))
    .slice(0, 4);

  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-500/8 blur-3xl" />
      </div>

      <section className="mx-auto max-w-6xl px-6 pb-12 pt-12 md:pb-16 md:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-medium tracking-wide text-[var(--muted-foreground)]">
              EVENT-DRIVEN AI STOCK PICKS
            </div>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              오늘 볼 종목을
              <br />
              <span className="text-[var(--primary)]">더 빠르게 판단</span>
            </h1>

            <p className="mt-6 text-base leading-8 text-[var(--muted-foreground)] md:text-lg">
              공시와 뉴스에서 호재 이벤트를 추출하고, AI가 추천 이유와 리스크를
              정리해 실제로 볼 만한 종목만 빠르게 추려줍니다.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/recommendations"
                className="inline-flex h-12 items-center rounded-2xl bg-[var(--primary)] px-6 text-sm font-semibold text-[var(--primary-foreground)] shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:opacity-95"
              >
                오늘의 추천 보기
              </Link>

              <Link
                href={featured ? `/stocks/${featured.stock.symbol}` : "/recommendations"}
                className="inline-flex h-12 items-center rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--card-hover)]"
              >
                대표 종목 보기
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <StatCard
                label="추천 종목"
                value={`${totalRecommendations}개`}
                caption="오늘 생성된 추천"
              />
              <StatCard
                label="평균 신뢰도"
                value={`${avgConfidence}%`}
                caption="추천 confidence 기준"
              />
              <StatCard
                label="긍정 이벤트"
                value={`${positiveEvents}건`}
                caption="추천 근거 기준 집계"
              />
            </div>

            <div className="mt-6">
              <GenerateRecommendationsButton />
            </div>
          </div>

          <div>
            {featured ? (
              <FeaturedCard
                stockName={featured.stock.name}
                stockSymbol={featured.stock.symbol}
                score={featured.totalScore}
                reason={featuredEvidence?.analysis?.summary ?? featured.reason}
                risk={featured.risk}
                confidence={featured.confidence}
                topEventCount={featuredEvidence?.topEvents?.length ?? 0}
                positiveCount={featuredEvidence?.metrics?.positiveEvents ?? 0}
                negativeCount={featuredEvidence?.metrics?.negativeEvents ?? 0}
              />
            ) : (
              <div className="rounded-[32px] border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
                <div className="text-lg font-medium">추천 데이터가 아직 없습니다</div>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  추천 생성 API를 먼저 실행해 주세요.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">추가 추천 종목</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              오늘 함께 볼 만한 후속 후보
            </p>
          </div>

          <Link
            href="/recommendations"
            className="text-sm font-medium text-[var(--primary)]"
          >
            전체 보기 →
          </Link>
        </div>

        {secondary.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {secondary.map((item) => {
              const evidence = asEvidence(item.evidence as Prisma.JsonValue | null);
              const summary = evidence?.analysis?.summary ?? item.reason;
              const confidencePercent = confidenceToPercent(item.confidence);

              return (
                <Link
                  key={item.id}
                  href={`/stocks/${item.stock.symbol}`}
                  className="block"
                >
                  <article className="h-full rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-lg font-semibold tracking-tight">
                          {item.stock.name}
                        </div>
                        <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                          {item.stock.symbol}
                        </div>
                      </div>

                      <div className="rounded-xl bg-[var(--background)] px-3 py-2 text-right">
                        <div className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                          Score
                        </div>
                        <div className="mt-1 text-lg font-bold text-[var(--primary)]">
                          {item.totalScore.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--foreground)]">
                      {summary}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
                        근거 {evidence?.topEvents?.length ?? 0}개
                      </span>
                    </div>

                    <div className="mt-5">
                      <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                        <span>신뢰도</span>
                        <span>{confidencePercent.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--background)]">
                        <div
                          className="h-full rounded-full bg-[var(--primary)]"
                          style={{ width: `${confidencePercent}%` }}
                        />
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            추가 추천 종목이 없습니다.
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  최근 강한 이벤트
                </h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  추천 점수에 크게 기여한 이벤트
                </p>
              </div>
            </div>

            {topEvents.length > 0 ? (
              <div className="space-y-3">
                {topEvents.map((event, index) => {
                  const numericScore = event.score ?? 0;
                  const isPositive = numericScore >= 0;

                  return (
                    <div
                      key={`${event.stockSymbol}-${event.title}-${index}`}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                            {event.stockName} · {event.eventType}
                          </div>
                          <div className="mt-1 text-sm font-semibold leading-6 text-[var(--foreground)]">
                            {event.title}
                          </div>
                          <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                            {event.sourceName}
                            {event.publishedAt
                              ? ` · ${new Date(event.publishedAt).toLocaleDateString("ko-KR")}`
                              : ""}
                          </div>
                        </div>

                        <div
                          className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${
                            isPositive
                              ? "bg-[color:rgb(34_197_94_/_0.10)] text-[var(--positive)]"
                              : "bg-[color:rgb(248_113_113_/_0.10)] text-[var(--negative)]"
                          }`}
                        >
                          {numericScore > 0 ? "+" : ""}
                          {formatScore(event.score)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                표시할 이벤트가 없습니다.
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">
                오늘의 AI 분석 포인트
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                대표 추천 종목 기준 핵심 분석 요약
              </p>
            </div>

            {featured && featuredEvidence ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[var(--background)] p-4">
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                    Summary
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">
                    {featuredEvidence.analysis?.summary ?? featured.reason}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                    <div className="text-sm font-semibold text-[var(--foreground)]">
                      긍정 요인
                    </div>
                    <ul className="mt-3 space-y-2">
                      {(featuredEvidence.analysis?.positives ?? [])
                        .slice(0, 3)
                        .map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="text-sm leading-6 text-[var(--muted-foreground)]"
                          >
                            + {item}
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                    <div className="text-sm font-semibold text-[var(--foreground)]">
                      리스크
                    </div>
                    <ul className="mt-3 space-y-2">
                      {(featuredEvidence.analysis?.risks ?? [])
                        .slice(0, 3)
                        .map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="text-sm leading-6 text-[var(--muted-foreground)]"
                          >
                            • {item}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>

                <Link
                  href={`/stocks/${featured.stock.symbol}`}
                  className="inline-flex text-sm font-medium text-[var(--primary)]"
                >
                  대표 종목 상세 분석 보기 →
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                분석 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-[var(--muted-foreground)]">{caption}</div>
    </div>
  );
}

function FeaturedCard({
  stockName,
  stockSymbol,
  score,
  reason,
  risk,
  confidence,
  topEventCount,
  positiveCount,
  negativeCount,
}: {
  stockName: string;
  stockSymbol: string;
  score: number;
  reason: string;
  risk?: string | null;
  confidence?: number | null;
  topEventCount: number;
  positiveCount: number;
  negativeCount: number;
}) {
  const confidencePercent = confidenceToPercent(confidence);

  return (
    <div className="rounded-[32px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl shadow-slate-900/5">
      <div className="rounded-[24px] bg-[var(--background)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Today&apos;s Highlight
            </div>
            <div className="mt-3 text-2xl font-semibold">{stockName}</div>
            <div className="mt-1 text-sm text-[var(--muted-foreground)]">
              {stockSymbol}
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--card)] px-4 py-3 text-right shadow-sm">
            <div className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
              Score
            </div>
            <div className="mt-1 text-2xl font-bold text-[var(--primary)]">
              {score.toFixed(1)}
            </div>
          </div>
        </div>

        <p className="mt-6 text-sm leading-7 text-[var(--foreground)]">{reason}</p>

        {risk && (
          <p className="mt-4 text-sm leading-7 text-[var(--negative)]">⚠ {risk}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--card)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
            근거 이벤트 {topEventCount}개
          </span>
          <span className="rounded-full bg-[color:rgb(34_197_94_/_0.10)] px-3 py-1 text-xs text-[var(--positive)]">
            긍정 {positiveCount}
          </span>
          <span className="rounded-full bg-[color:rgb(248_113_113_/_0.10)] px-3 py-1 text-xs text-[var(--negative)]">
            부정 {negativeCount}
          </span>
        </div>

        {typeof confidence === "number" && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span>신뢰도</span>
              <span>{confidencePercent.toFixed(0)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--card)]">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
          </div>
        )}

        <Link
          href={`/stocks/${stockSymbol}`}
          className="mt-6 inline-flex text-sm font-medium text-[var(--primary)]"
        >
          상세 분석 보기 →
        </Link>
      </div>
    </div>
  );
}