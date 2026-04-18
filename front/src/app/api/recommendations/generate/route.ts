import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildDailyRecommendations } from "@/server/services/recommendation-service";
import { recommendationRepository } from "@/server/repositories/recommendation-repository";

export async function POST() {
  try {
    const targetDate = new Date();

    const stocks = await db.stock.findMany({
      include: {
        events: {
          where: {
            isNoise: false,
          },
          orderBy: {
            publishedAt: "desc",
          },
        },
      },
    });

    if (stocks.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No stocks found",
        },
        { status: 400 }
      );
    }

    const builtRecommendations = buildDailyRecommendations({
      stocks,
      targetDate,
      minScore: 30,
      limit: 20,
    });

    if (builtRecommendations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No recommendations generated",
        },
        { status: 400 }
      );
    }

    const result = await recommendationRepository.replaceDailyRecommendations(
      targetDate,
      builtRecommendations.map((item) => ({
        stockId: item.stockId,
        targetDate,
        totalScore: item.totalScore,
        reason: `${item.stockName} 관련 주요 이벤트 ${item.topEventsForLlm.length}건이 반영되었습니다.`,
        risk: "단기 변동성 가능성에 유의해야 합니다.",
        confidence: item.confidence,
        evidence: item.evidence,
      }))
    );

    return NextResponse.json({
      success: true,
      message: "Recommendations generated successfully",
      targetDate: targetDate.toISOString(),
      deletedCount: result.deletedCount,
      createdCount: result.createdCount,
      data: builtRecommendations.map((item) => ({
        stockId: item.stockId,
        stockName: item.stockName,
        stockSymbol: item.stockSymbol,
        totalScore: item.totalScore,
        confidence: item.confidence,
      })),
    });
  } catch (error: unknown) {
    console.error("[API] /api/recommendations/generate error:", error);

    let message = "Internal Server Error";

    if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}