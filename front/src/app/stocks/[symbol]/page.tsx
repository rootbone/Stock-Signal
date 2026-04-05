import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
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
    score: number;
    publishedAt?: string;
  }[];
  metrics?: {
    totalEvents?: number;
    positiveEvents?: number;
    negativeEvents?: number;
  };
};

async function getStockDetail(symbol: string) {
  return db.stock.findUnique({
    where: { symbol },
    include: {
      recommendations: {
        orderBy: { targetDate: "desc" },
        take: 1,
      },
      events: {
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
      text: "text-[var(--positive)]",
      chip: "bg-[color:rgb(34_197_94_/_0.10)] text-[var(--positive)]",
    };
  }

  if (score >= 60) {
    return {
      text: "text-[var(--primary)]",
      chip: "bg-[color:rgb(37_99_235_/_0.10)] text-[var(--primary)]",
    };
  }

  return {
    text: "text-[var(--negative)]",
    chip: "bg-[color:rgb(248_113_113_/_0.10)] text-[var(--negative)]",
  };
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

  const recommendation = stock.recommendations[0];
  const evidence = recommendation ? asEvidence(recommendation.evidence) : null;
  const history = await recommendationRepository.findScoreHistory(stock.id);

  const chartData = history.map((h) => ({
    date: new Date(h.targetDate).toLocaleDateString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
    }),
    score: h.totalScore,
  }));

  const confidencePercent = confidenceToPercent(recommendation?.confidence);
  const latestScore = recommendation?.totalScore ?? 0;
  const tone = scoreTone(latestScore);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
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
            </div>

            <div className="mt-2 text-sm text-[var(--muted-foreground)]">
              {stock.symbol}
              {stock.market ? ` · ${stock.market}` : ""}
              {stock.sector ? ` · ${stock.sector}` : ""}
            </div>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
              {evidence?.analysis?.summary ?? recommendation?.reason ?? "최신 분석 데이터가 없습니다."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-3">
            <MetricCard label="신뢰도" value={`${confidencePercent.toFixed(0)}%`} />
            <MetricCard
              label="근거 이벤트"
              value={`${evidence?.topEvents?.length ?? 0}개`}
            />
            <MetricCard
              label="전체 이벤트"
              value={`${evidence?.metrics?.totalEvents ?? stock.events.length}개`}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">AI 분석</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                최신 추천 기준 핵심 해석
              </p>
            </div>

            <div className="rounded-2xl bg-[var(--background)] p-4">
              <div className="text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                Summary
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">
                {evidence?.analysis?.summary ?? recommendation?.reason ?? "-"}
              </p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                <div className="text-sm font-semibold">긍정 요인</div>
                <ul className="mt-3 space-y-2">
                  {(evidence?.analysis?.positives ?? []).length > 0 ? (
                    evidence?.analysis?.positives?.map((item, index) => (
                      <li
                        key={`${item}-${index}`}
                        className="text-sm leading-6 text-[var(--muted-foreground)]"
                      >
                        + {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm leading-6 text-[var(--muted-foreground)]">
                      데이터 없음
                    </li>
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                <div className="text-sm font-semibold">리스크</div>
                <ul className="mt-3 space-y-2">
                  {(evidence?.analysis?.risks ?? []).length > 0 ? (
                    evidence?.analysis?.risks?.map((item, index) => (
                      <li
                        key={`${item}-${index}`}
                        className="text-sm leading-6 text-[var(--muted-foreground)]"
                      >
                        • {item}
                      </li>
                    ))
                  ) : recommendation?.risk ? (
                    <li className="text-sm leading-6 text-[var(--muted-foreground)]">
                      • {recommendation.risk}
                    </li>
                  ) : (
                    <li className="text-sm leading-6 text-[var(--muted-foreground)]">
                      데이터 없음
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {typeof recommendation?.confidence === "number" && (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span>신뢰도</span>
                  <span>{confidencePercent.toFixed(0)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--background)]">
                  <div
                    className="h-full rounded-full bg-[var(--primary)]"
                    style={{ width: `${confidencePercent}%` }}
                  />
                </div>
              </div>
            )}
          </section>

            <section className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-4">
                <h2 className="text-xl font-semibold tracking-tight">점수 변화</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                최근 추천 점수 추이와 변화폭
                </p>
            </div>

            {chartData.length > 0 ? (
                <ScoreChart data={chartData} />
            ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                데이터 없음
                </div>
            )}
            </section>

          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">최근 이벤트</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                최근 수집된 이벤트와 점수 영향
              </p>
            </div>

            {stock.events.length > 0 ? (
              <div className="space-y-3">
                {stock.events.map((event) => {
                  const positive = event.score >= 0;

                  return (
                    <article
                      key={event.id}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                            {event.sourceName} ·{" "}
                            {new Date(event.publishedAt).toLocaleDateString("ko-KR")}
                          </div>

                          <div className="mt-1 text-base font-semibold tracking-tight">
                            {event.title}
                          </div>

                          {event.summary && (
                            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                              {event.summary}
                            </p>
                          )}
                        </div>

                        <div
                          className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${
                            positive
                              ? "bg-[color:rgb(34_197_94_/_0.10)] text-[var(--positive)]"
                              : "bg-[color:rgb(248_113_113_/_0.10)] text-[var(--negative)]"
                          }`}
                        >
                          {event.score > 0 ? "+" : ""}
                          {event.score.toFixed(2)}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                이벤트 데이터 없음
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">이벤트 통계</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                추천 계산에 반영된 요약 지표
              </p>
            </div>

            <div className="grid gap-3">
              <MetricRow label="총 이벤트" value={`${evidence?.metrics?.totalEvents ?? 0}`} />
              <MetricRow
                label="긍정 이벤트"
                value={`${evidence?.metrics?.positiveEvents ?? 0}`}
                valueClassName="text-[var(--positive)]"
              />
              <MetricRow
                label="부정 이벤트"
                value={`${evidence?.metrics?.negativeEvents ?? 0}`}
                valueClassName="text-[var(--negative)]"
              />
            </div>
          </section>

          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">추천 근거 이벤트</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                점수에 크게 기여한 이벤트
              </p>
            </div>

            {evidence?.topEvents?.length ? (
              <div className="space-y-3">
                {evidence.topEvents.map((event, index) => {
                  const positive = event.score >= 0;

                  return (
                    <div
                      key={`${event.title}-${index}`}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                            {event.sourceName ?? event.sourceType ?? "SOURCE"} ·{" "}
                            {event.eventType ?? "EVENT"}
                          </div>

                          <div className="mt-1 text-sm font-semibold leading-6">
                            {event.title}
                          </div>

                          {event.summary && (
                            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                              {event.summary}
                            </p>
                          )}
                        </div>

                        <div
                          className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${
                            positive
                              ? "bg-[color:rgb(34_197_94_/_0.10)] text-[var(--positive)]"
                              : "bg-[color:rgb(248_113_113_/_0.10)] text-[var(--negative)]"
                          }`}
                        >
                          {event.score > 0 ? "+" : ""}
                          {event.score.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                추천 근거 이벤트가 없습니다.
              </div>
            )}
          </section>
        </div>
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
      <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[var(--background)] px-4 py-3">
      <div className="text-sm text-[var(--muted-foreground)]">{label}</div>
      <div className={`text-sm font-semibold ${valueClassName ?? "text-[var(--foreground)]"}`}>
        {value}
      </div>
    </div>
  );
}