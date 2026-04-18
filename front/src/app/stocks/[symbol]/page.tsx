import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { db } from "@/lib/db";
import { recommendationRepository } from "@/server/repositories/recommendation-repository";
import ScoreChart from "./ScoreChart";

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
    sourceType?: string;
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

function normalizeSymbol(symbol: string) {
  return symbol.trim().padStart(6, "0");
}

async function getStockDetail(symbol: string) {
  const normalizedSymbol = normalizeSymbol(symbol);

  return db.stock.findUnique({
    where: { symbol: normalizedSymbol },
    include: {
      recommendations: {
        orderBy: { targetDate: "desc" },
        take: 1,
      },
      events: {
        where: {
          isNoise: false,
        },
        orderBy: { publishedAt: "desc" },
        take: 20,
      },
    },
  });
}

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

function scoreTone(score: number) {
  if (score >= 80) {
    return {
      chip: "bg-[color:rgb(34_197_94_/_0.10)] text-[var(--positive)]",
      label: "매우 긍정",
    };
  }

  if (score >= 60) {
    return {
      chip: "bg-[color:rgb(37_99_235_/_0.10)] text-[var(--primary)]",
      label: "긍정",
    };
  }

  if (score >= 40) {
    return {
      chip: "bg-[color:rgb(250_204_21_/_0.12)] text-yellow-600",
      label: "중립",
    };
  }

  return {
    chip: "bg-[color:rgb(248_113_113_/_0.10)] text-[var(--negative)]",
    label: "주의",
  };
}

function formatDate(value: Date | string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(value: Date | string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEventBadgeTone(eventType?: string) {
  switch (eventType) {
    case "CONTRACT":
      return "bg-blue-500/10 text-blue-600";
    case "EARNINGS":
      return "bg-green-500/10 text-green-600";
    case "PARTNERSHIP":
      return "bg-violet-500/10 text-violet-600";
    case "PRODUCT":
      return "bg-orange-500/10 text-orange-600";
    case "DISCLOSURE":
      return "bg-slate-500/10 text-slate-600";
    default:
      return "bg-[var(--muted)] text-[var(--muted-foreground)]";
  }
}

function formatScore(score?: number | null) {
  return typeof score === "number" ? score.toFixed(1) : "-";
}

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;

  if (!symbol) return notFound();

  const stock = await getStockDetail(symbol);

  if (!stock) return notFound();

  const recommendation = stock.recommendations[0] ?? null;
  const evidence = recommendation ? asEvidence(recommendation.evidence) : null;
  const history = await recommendationRepository.findScoreHistory(stock.id);

  const chartData =
    history.length > 0
      ? history.map((h) => ({
          date: new Date(h.targetDate).toLocaleDateString("ko-KR", {
            month: "2-digit",
            day: "2-digit",
          }),
          score: h.totalScore,
        }))
      : recommendation
        ? [
            {
              date: new Date(recommendation.targetDate).toLocaleDateString("ko-KR", {
                month: "2-digit",
                day: "2-digit",
              }),
              score: recommendation.totalScore,
            },
          ]
        : [];

  const confidencePercent = confidenceToPercent(recommendation?.confidence);
  const latestScore = recommendation?.totalScore ?? 0;
  const tone = scoreTone(latestScore);

  const positives = evidence?.analysis?.positives ?? [];
  const risks = evidence?.analysis?.risks ?? [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <Link
          href="/recommendations"
          className="text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
        >
          ← 추천 리스트로 돌아가기
        </Link>
      </div>

      <section className="mb-8 rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              Stock Detail
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {stock.name}
              </h1>

              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold ${tone.chip}`}
              >
                Score {latestScore.toFixed(1)}
              </div>

              <div className="rounded-full bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                {tone.label}
              </div>
            </div>

            <div className="mt-2 text-sm text-[var(--muted-foreground)]">
              {stock.symbol}
              {stock.market ? ` · ${stock.market}` : ""}
              {stock.sector ? ` · ${stock.sector}` : ""}
            </div>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
              {evidence?.analysis?.summary ??
                recommendation?.reason ??
                "최신 분석 데이터가 없습니다."}
            </p>

            {recommendation ? (
              <div className="mt-4 text-xs text-[var(--muted-foreground)]">
                최근 추천일: {formatDate(recommendation.targetDate)}
              </div>
            ) : (
              <div className="mt-4 text-xs text-[var(--muted-foreground)]">
                추천 데이터가 아직 생성되지 않았습니다.
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
            <MetricCard label="신뢰도" value={`${confidencePercent.toFixed(0)}%`} />
            <MetricCard
              label="근거 이벤트"
              value={`${evidence?.topEvents?.length ?? stock.events.length}개`}
            />
            <MetricCard label="전체 이벤트" value={`${stock.events.length}개`} />
            <MetricCard label="리스크 요인" value={`${risks.length}개`} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">AI 분석</h2>
            </div>

            <div className="rounded-2xl bg-[var(--background)] p-4">
              <p className="text-sm leading-7 text-[var(--foreground)]">
                {evidence?.analysis?.summary ?? recommendation?.reason ?? "-"}
              </p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                <div className="mb-3 text-sm font-semibold">긍정 포인트</div>
                {positives.length > 0 ? (
                  <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
                    {positives.map((item, index) => (
                      <li key={`${item}-${index}`} className="leading-6">
                        • {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-[var(--muted-foreground)]">
                    긍정 포인트 데이터가 없습니다.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                <div className="mb-3 text-sm font-semibold">리스크 요인</div>
                {risks.length > 0 ? (
                  <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
                    {risks.map((item, index) => (
                      <li key={`${item}-${index}`} className="leading-6">
                        • {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-[var(--muted-foreground)]">
                    리스크 데이터가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">점수 변화</h2>
              <div className="text-xs text-[var(--muted-foreground)]">
                최근 7일 기준
              </div>
            </div>

            {chartData.length > 0 ? (
              <ScoreChart data={chartData} />
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted-foreground)]">
                차트 데이터가 없습니다. recommendation 데이터를 생성하면 표시됩니다.
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">추천 근거 이벤트</h2>
            </div>

            {evidence?.topEvents && evidence.topEvents.length > 0 ? (
              <div className="space-y-3">
                {evidence.topEvents.map((event, index) => (
                  <article
                    key={`${event.title}-${index}`}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold">{event.title}</div>
                      {event.eventType ? (
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-medium ${getEventBadgeTone(
                            event.eventType
                          )}`}
                        >
                          {event.eventType}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {event.sourceType ?? "-"} · {event.sourceName ?? "-"} · 점수{" "}
                      {formatScore(event.score)}
                    </div>

                    {event.summary ? (
                      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                        {event.summary}
                      </p>
                    ) : null}

                    {event.publishedAt ? (
                      <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                        게시일: {formatDateTime(event.publishedAt)}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted-foreground)]">
                추천 근거 이벤트 데이터가 없습니다.
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">최근 이벤트</h2>
            </div>

            <div className="space-y-3">
              {stock.events.length > 0 ? (
                stock.events.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold">{event.title}</div>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-medium ${getEventBadgeTone(
                          event.eventType
                        )}`}
                      >
                        {event.eventType}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {event.sourceType} · {event.sourceName} · {formatDateTime(event.publishedAt)}
                    </div>

                    {event.summary ? (
                      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                        {event.summary}
                      </p>
                    ) : event.content ? (
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted-foreground)]">
                        {event.content}
                      </p>
                    ) : null}

                    <div className="mt-3 text-xs font-medium text-[var(--muted-foreground)]">
                      이벤트 점수: {formatScore(event.score)}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted-foreground)]">
                  최근 이벤트가 없습니다.
                </div>
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="text-xs text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-2 text-xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}