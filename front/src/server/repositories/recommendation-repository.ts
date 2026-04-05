import { Recommendation, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type RecommendationWithStock = Prisma.RecommendationGetPayload<{
  include: {
    stock: true;
  };
}>;

/**
 * 날짜를 "00:00:00" 기준으로 정규화
 */
function normalizeDate(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 하루 범위 생성 (gte ~ lt)
 */
function getDateRange(date: Date) {
  const start = normalizeDate(date);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export class RecommendationRepository {
  /**
   * 특정 날짜 데이터 삭제 (range 기반)
   */
  async deleteByTargetDate(targetDate: Date): Promise<{ count: number }> {
    const { start, end } = getDateRange(targetDate);

    const result = await db.recommendation.deleteMany({
      where: {
        targetDate: {
          gte: start,
          lt: end,
        },
      },
    });

    return { count: result.count };
  }

  /**
   * 여러 추천 생성 (날짜 normalize 적용)
   */
  async createMany(
    data: Prisma.RecommendationCreateManyInput[],
  ): Promise<{ count: number }> {
    if (data.length === 0) {
      return { count: 0 };
    }

    const normalizedData = data.map((item) => ({
      ...item,
      targetDate: normalizeDate(new Date(item.targetDate)),
    }));

    const result = await db.recommendation.createMany({
      data: normalizedData,
    });

    return { count: result.count };
  }

  /**
   * 특정 날짜 추천 전체 교체 (삭제 + 생성)
   */
  async replaceDailyRecommendations(
    targetDate: Date,
    data: Prisma.RecommendationCreateManyInput[],
  ): Promise<{ deletedCount: number; createdCount: number }> {
    const { start, end } = getDateRange(targetDate);

    const normalizedData = data.map((item) => ({
      ...item,
      targetDate: normalizeDate(new Date(item.targetDate)),
    }));

    const [deleted, created] = await db.$transaction([
      db.recommendation.deleteMany({
        where: {
          targetDate: {
            gte: start,
            lt: end,
          },
        },
      }),
      db.recommendation.createMany({
        data: normalizedData,
      }),
    ]);

    return {
      deletedCount: deleted.count,
      createdCount: created.count,
    };
  }

  /**
   * 특정 날짜 추천 조회
   */
  async findByTargetDate(
    targetDate: Date,
    limit = 20,
  ): Promise<RecommendationWithStock[]> {
    const { start, end } = getDateRange(targetDate);

    return db.recommendation.findMany({
      where: {
        targetDate: {
          gte: start,
          lt: end,
        },
      },
      include: {
        stock: true,
      },
      orderBy: [
        { totalScore: "desc" },
        { confidence: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
    });
  }

  /**
   * 가장 최신 날짜 기준 추천 조회
   */
  async findTopLatest(
    limit = 20,
  ): Promise<RecommendationWithStock[]> {
    const latest = await db.recommendation.findFirst({
      orderBy: {
        targetDate: "desc",
      },
      select: {
        targetDate: true,
      },
    });

    if (!latest) {
      return [];
    }

    const { start, end } = getDateRange(latest.targetDate);

    return db.recommendation.findMany({
      where: {
        targetDate: {
          gte: start,
          lt: end,
        },
      },
      include: {
        stock: true,
      },
      orderBy: [
        { totalScore: "desc" },
        { confidence: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
    });
  }

  async findScoreHistory(stockId: string, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return db.recommendation.findMany({
    where: {
      stockId,
      targetDate: {
        gte: since,
      },
    },
    orderBy: {
      targetDate: "asc",
    },
    select: {
      targetDate: true,
      totalScore: true,
      confidence: true,
    },
  });
}
}

export const recommendationRepository = new RecommendationRepository();