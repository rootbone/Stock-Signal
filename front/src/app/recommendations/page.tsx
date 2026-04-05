import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { recommendationRepository } from "@/server/repositories/recommendation-repository";

export const revalidate = 60;

type RecommendationEvidence = {
  analysis?: {
    summary?: string;
    positives?: string[];
    risks?: string[];
  };
  topEvents?: {
    title: string;
    score: number;
    eventType?: string;
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

export default async function RecommendationsPage() {
  const recommendations = await recommendationRepository.findTopLatest(20);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">오늘의 추천</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          최신 추천일 기준 상위 종목입니다.
        </p>
      </section>

      {recommendations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
          <div className="text-lg font-medium">추천 데이터가 아직 없습니다</div>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            추천 생성 API를 먼저 실행해 주세요.
          </p>
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((rec) => {
            const evidence = asEvidence(rec.evidence as Prisma.JsonValue | null);
            const confidencePercent = confidenceToPercent(rec.confidence);
            const topEventCount = evidence?.topEvents?.length ?? 0;
            const positiveEventCount = evidence?.metrics?.positiveEvents ?? 0;
            const negativeEventCount = evidence?.metrics?.negativeEvents ?? 0;
            const summary = evidence?.analysis?.summary ?? rec.reason;

            return (
              <Link
                key={rec.id}
                href={`/stocks/${rec.stock.symbol}`}
                className="block"
              >
                <article className="h-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--card-hover)] hover:shadow-md">
                  {/* header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-lg font-semibold">{rec.stock.name}</div>
                      <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {rec.stock.symbol}
                      </div>
                    </div>

                    <div className="shrink-0 rounded-xl bg-[var(--background)] px-3 py-2 text-right">
                      <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                        Score
                      </div>
                      <div className="text-lg font-bold text-[var(--primary)]">
                        {rec.totalScore.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* summary */}
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--foreground)]">
                    {summary}
                  </p>

                  {/* risk */}
                  {rec.risk && (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--negative)]">
                      ⚠ {rec.risk}
                    </p>
                  )}

                  {/* badges */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
                      근거 이벤트 {topEventCount}개
                    </span>

                    <span className="rounded-full bg-[color:rgb(34_197_94_/_0.10)] px-3 py-1 text-xs text-[var(--positive)]">
                      긍정 {positiveEventCount}
                    </span>

                    <span className="rounded-full bg-[color:rgb(248_113_113_/_0.10)] px-3 py-1 text-xs text-[var(--negative)]">
                      부정 {negativeEventCount}
                    </span>
                  </div>

                  {/* confidence */}
                  {typeof rec.confidence === "number" && (
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
                  )}

                  <div className="mt-5 text-sm font-medium text-[var(--primary)]">
                    자세히 보기 →
                  </div>
                </article>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}