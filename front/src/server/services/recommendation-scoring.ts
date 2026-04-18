import { Prisma, Event, Stock } from "@prisma/client";

type StockWithEvents = Stock & {
  events: Event[];
};

interface BuildDailyRecommendationsParams {
  stocks: StockWithEvents[];
  targetDate: Date;
  minScore: number;
  limit: number;
}

export type DailyRecommendationEvidenceEvent = {
  eventId: string;
  eventType: string;
  sourceType: string;
  sourceName: string;
  title: string;
  publishedAt: string;
  originalScore: number;
  adjustedScore: number;
  summary: string | null;
  sourceUrl: string | null;
};

export interface DailyRecommendationBuildResult {
  stockId: string;
  stockName: string;
  stockSymbol: string;
  market: string;
  sector: string | null;
  totalScore: number;
  confidence: number;
  evidence: Prisma.InputJsonObject;
  topEventsForLlm: DailyRecommendationEvidenceEvent[];
}

const EVENT_TYPE_WEIGHT: Record<string, number> = {
  CONTRACT: 1.8,
  EARNINGS: 1.2,
  DISCLOSURE: 1.0,
  GUIDANCE: 1.15,
  PRODUCT: 1.1,
  PARTNERSHIP: 1.25,
  DEFAULT: 0.9,
};

const SOURCE_TYPE_WEIGHT: Record<string, number> = {
  DART: 1.2,
  NEWS: 1.0,
  BASIC_INFO: 0.6,
  DEFAULT: 1.0,
};

export function buildDailyRecommendations(
  params: BuildDailyRecommendationsParams,
): DailyRecommendationBuildResult[] {
  const { stocks, targetDate, minScore, limit } = params;

  return stocks
    .map((stock) => calculateStockRecommendation(stock, targetDate))
    .filter(
      (item): item is DailyRecommendationBuildResult => item !== null,
    )
    .filter((item) => item.totalScore >= minScore)
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return b.confidence - a.confidence;
    })
    .slice(0, limit);
}

function calculateStockRecommendation(
  stock: StockWithEvents,
  targetDate: Date,
): DailyRecommendationBuildResult | null {
  const scoredEvents = stock.events.map((event) => ({
    event,
    adjustedScore: calculateEventScore(event, targetDate),
  }));

  const activeEvents = scoredEvents.filter((item) => item.adjustedScore > 0);

  if (activeEvents.length === 0) {
    return null;
  }

  const totalScore = roundNumber(
    activeEvents.reduce((acc, cur) => acc + cur.adjustedScore, 0),
  );

  const sortedTopEvents = [...activeEvents]
    .sort((a, b) => b.adjustedScore - a.adjustedScore)
    .slice(0, 5);

  const confidence = calculateConfidence(scoredEvents, sortedTopEvents);

  const noiseCount = stock.events.filter((event) => event.isNoise).length;
  const positiveEventCount = activeEvents.filter(
    (item) => item.adjustedScore >= 10,
  ).length;

  const averageFreshnessWeight =
    activeEvents.length === 0
      ? 0
      : roundNumber(
          activeEvents.reduce(
            (acc, cur) => acc + freshnessWeight(cur.event.publishedAt, targetDate),
            0,
          ) / activeEvents.length,
        );

  const topEventsForLlm: DailyRecommendationEvidenceEvent[] = sortedTopEvents.map(
    ({ event, adjustedScore }) => ({
      eventId: event.id,
      eventType: event.eventType,
      sourceType: event.sourceType,
      sourceName: event.sourceName,
      title: event.title,
      publishedAt: event.publishedAt.toISOString(),
      originalScore: event.score,
      adjustedScore: roundNumber(adjustedScore),
      summary: event.summary,
      sourceUrl: event.sourceUrl,
    }),
  );

  const evidence: Prisma.InputJsonObject = {
    targetDate: targetDate.toISOString(),
    stock: {
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      market: stock.market,
      sector: stock.sector,
    },
    metrics: {
      rawEventCount: stock.events.length,
      activeEventCount: activeEvents.length,
      noiseCount,
      positiveEventCount,
      averageFreshnessWeight,
    },
    topEvents: topEventsForLlm,
  };

  return {
    stockId: stock.id,
    stockName: stock.name,
    stockSymbol: stock.symbol,
    market: stock.market,
    sector: stock.sector,
    totalScore,
    confidence,
    evidence,
    topEventsForLlm,
  };
}

export function calculateEventScore(event: Event, targetDate: Date): number {
  if (event.isNoise) {
    return 0;
  }

  const typeWeight = EVENT_TYPE_WEIGHT[event.eventType] ?? EVENT_TYPE_WEIGHT.DEFAULT;
  const sourceWeight =
    SOURCE_TYPE_WEIGHT[event.sourceType] ?? SOURCE_TYPE_WEIGHT.DEFAULT;

  const baseScore = resolveBaseScore(event);
  const freshness = freshnessWeight(event.publishedAt, targetDate);

  return roundNumber(Math.max(baseScore * typeWeight * sourceWeight * freshness, 0));
}

function resolveBaseScore(event: Event): number {
  if (event.score > 0) {
    return event.score;
  }

  switch (event.eventType) {
    case "CONTRACT":
      return 20;
    case "EARNINGS":
      return 12;
    case "GUIDANCE":
      return 11;
    case "PARTNERSHIP":
      return 10;
    case "PRODUCT":
      return 8;
    case "DISCLOSURE":
      return 7;
    default:
      return 5;
  }
}

function freshnessWeight(publishedAt: Date, targetDate: Date): number {
  const diffMs =
    normalizeDateOnly(targetDate).getTime() -
    normalizeDateOnly(publishedAt).getTime();

  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (days <= 1) return 1.3;
  if (days <= 3) return 1.15;
  if (days <= 7) return 1.0;
  if (days <= 14) return 0.8;
  if (days <= 30) return 0.5;
  return 0.2;
}

function calculateConfidence(
  allScoredEvents: { event: Event; adjustedScore: number }[],
  topEvents: { event: Event; adjustedScore: number }[],
): number {
  const nonNoiseCount = allScoredEvents.filter((item) => !item.event.isNoise).length;
  const trustedSourceCount = topEvents.filter(
    (item) => item.event.sourceName === "DART",
  ).length;

  const averageTopScore =
    topEvents.length > 0
      ? topEvents.reduce((acc, cur) => acc + cur.adjustedScore, 0) / topEvents.length
      : 0;

  let confidence = 0.4;

  if (nonNoiseCount >= 3) confidence += 0.15;
  if (nonNoiseCount >= 5) confidence += 0.1;
  if (trustedSourceCount >= 1) confidence += 0.15;
  if (trustedSourceCount >= 2) confidence += 0.05;
  if (averageTopScore >= 15) confidence += 0.1;
  if (averageTopScore >= 25) confidence += 0.05;

  return roundNumber(Math.min(confidence, 0.95));
}

function normalizeDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function roundNumber(value: number): number {
  return Math.round(value * 100) / 100;
}