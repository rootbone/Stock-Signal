import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  buildDailyRecommendations,
  type DailyRecommendationBuildResult,
} from "./recommendation-scoring";
import {
  recommendationRepository,
  type RecommendationWithStock,
} from "@/server/repositories/recommendation-repository";
import { llmService } from "@/server/llm/llm-service";
import type { RecommendationLlmOutput } from "@/server/llm/recommendation-llm-schema";

export interface GenerateDailyRecommendationsParams {
  targetDate?: Date;
  lookbackDays?: number;
  limit?: number;
  minScore?: number;
}

export interface DailyRecommendationItem {
  id: string;
  stockId: string;
  stockSymbol: string;
  stockName: string;
  totalScore: number;
  reason: string;
  risk: string | null;
  confidence: number | null;
  evidence: Prisma.JsonValue | null;
}

export interface DailyRecommendationResult {
  targetDate: Date;
  createdCount: number;
  deletedCount: number;
  items: DailyRecommendationItem[];
}

type RecommendationEvidence = {
  analysis: RecommendationLlmOutput;
  topEvents: {
    title: string;
    eventType: string;
    sourceType: string;
    score: number;
    publishedAt: string;
    summary?: string | null;
  }[];
  metrics: {
    totalEvents: number;
    positiveEvents: number;
    negativeEvents: number;
  };
};

export class RecommendationService {
  async generateDailyRecommendations(
    params: GenerateDailyRecommendationsParams = {},
  ): Promise<DailyRecommendationResult> {
    const targetDate = normalizeDateOnly(params.targetDate ?? new Date());
    const lookbackDays = params.lookbackDays ?? 14;
    const limit = params.limit ?? 10;
    const minScore = params.minScore ?? 20;

    const sinceDate = new Date(targetDate);
    sinceDate.setDate(sinceDate.getDate() - lookbackDays);

    const stocks = await db.stock.findMany({
      include: {
        events: {
          where: {
            publishedAt: {
              gte: sinceDate,
              lte: endOfDay(targetDate),
            },
          },
          orderBy: {
            publishedAt: "desc",
          },
        },
      },
    });

    const built: DailyRecommendationBuildResult[] = buildDailyRecommendations({
      stocks,
      targetDate,
      minScore,
      limit,
    });

    const createInputs: Prisma.RecommendationCreateManyInput[] = [];

    for (const item of built) {
      const analysis = await this.generateInsightWithFallback(item);

      const evidence: RecommendationEvidence = {
        analysis,
        topEvents: item.topEventsForLlm.map((event) => ({
          title: event.title,
          summary: event.summary,
          eventType: event.eventType,
          sourceType: event.sourceType,
          score: event.adjustedScore,
          publishedAt: event.publishedAt,
        })),
        metrics: {
          totalEvents: item.topEventsForLlm.length,
          positiveEvents: item.topEventsForLlm.filter(
            (event) => event.adjustedScore > 0,
          ).length,
          negativeEvents: item.topEventsForLlm.filter(
            (event) => event.adjustedScore < 0,
          ).length,
        },
      };

      createInputs.push({
        stockId: item.stockId,
        targetDate,
        totalScore: item.totalScore,
        reason: analysis.summary,
        risk: analysis.risks.length > 0 ? analysis.risks.join(" ") : null,
        evidence: evidence as Prisma.InputJsonValue,
        confidence: item.confidence,
      });
    }

    const result = await recommendationRepository.replaceDailyRecommendations(
      targetDate,
      createInputs,
    );

    const saved = await recommendationRepository.findByTargetDate(
      targetDate,
      limit,
    );

    return {
      targetDate,
      createdCount: result.createdCount,
      deletedCount: result.deletedCount,
      items: saved.map((item: RecommendationWithStock) => ({
        id: item.id,
        stockId: item.stockId,
        stockSymbol: item.stock.symbol,
        stockName: item.stock.name,
        totalScore: item.totalScore,
        reason: item.reason,
        risk: item.risk,
        confidence: item.confidence,
        evidence: item.evidence as Prisma.JsonValue | null,
      })),
    };
  }

  async getDailyRecommendations(
    targetDate?: Date,
    limit = 10,
  ): Promise<DailyRecommendationResult | null> {
    const normalizedTargetDate = targetDate
      ? normalizeDateOnly(targetDate)
      : undefined;

    const rows = normalizedTargetDate
      ? await recommendationRepository.findByTargetDate(normalizedTargetDate, limit)
      : await recommendationRepository.findTopLatest(limit);

    if (rows.length === 0) {
      return null;
    }

    return {
      targetDate: rows[0].targetDate,
      createdCount: rows.length,
      deletedCount: 0,
      items: rows.map((item: RecommendationWithStock) => ({
        id: item.id,
        stockId: item.stockId,
        stockSymbol: item.stock.symbol,
        stockName: item.stock.name,
        totalScore: item.totalScore,
        reason: item.reason,
        risk: item.risk,
        confidence: item.confidence,
        evidence: item.evidence as Prisma.JsonValue | null,
      })),
    };
  }

  private async generateInsightWithFallback(
    item: DailyRecommendationBuildResult,
  ): Promise<RecommendationLlmOutput> {
    try {
      return await llmService.generateRecommendationInsight({
        stockName: item.stockName,
        stockSymbol: item.stockSymbol,
        market: item.market,
        sector: item.sector,
        totalScore: item.totalScore,
        events: item.topEventsForLlm.map((event) => ({
          title: event.title,
          summary: event.summary,
          eventType: event.eventType,
          sourceType: event.sourceType,
          score: event.adjustedScore,
          publishedAt: event.publishedAt,
        })),
      });
    } catch (error) {
      console.error("[LLM insight fallback]", error);
      return buildFallbackInsight(item);
    }
  }
}

function buildFallbackInsight(
  item: DailyRecommendationBuildResult,
): RecommendationLlmOutput {
  const eventTypeLabels = Array.from(
    new Set(item.topEventsForLlm.map((event) => mapEventTypeLabel(event.eventType))),
  );

  const topTitle = item.topEventsForLlm[0]?.title ?? "주요 이벤트";
  const labels = eventTypeLabels.slice(0, 3);

  return {
    summary: `${item.stockName}(${item.stockSymbol})은(는) 최근 ${labels.join(", ")} 관련 이벤트가 집중되었고, 특히 "${topTitle}" 이슈의 기여도가 높아 오늘 주목 종목으로 분류되었습니다.`,
    positives: labels.map((label) => `${label} 관련 흐름이 반영되었습니다.`),
    risks: [
      "이벤트 기반 추천 특성상 단기 기대감이 선반영될 수 있습니다.",
      "실제 수급과 시장 반응에 따라 변동성이 확대될 수 있습니다.",
    ],
  };
}

function mapEventTypeLabel(eventType: string): string {
  switch (eventType) {
    case "CONTRACT":
      return "수주 공시";
    case "EARNINGS":
      return "실적 발표";
    case "GUIDANCE":
      return "가이던스";
    case "PARTNERSHIP":
      return "제휴";
    case "PRODUCT":
      return "신제품";
    case "DISCLOSURE":
      return "공시";
    default:
      return "이벤트";
  }
}

function normalizeDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

export const recommendationService = new RecommendationService();