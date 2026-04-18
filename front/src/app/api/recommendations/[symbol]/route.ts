import { NextRequest } from "next/server";
import { db } from "@/lib/db";

function normalizeDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDateRange(date: Date) {
  const start = normalizeDateOnly(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ symbol: string }> },
): Promise<Response> {
  try {
    const { symbol } = await context.params;

    if (!symbol) {
      return Response.json(
        {
          success: false,
          message: "Symbol is required",
        },
        { status: 400 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const targetDateParam = searchParams.get("targetDate");

    const parsedTargetDate = targetDateParam
      ? new Date(targetDateParam)
      : undefined;

    if (
      parsedTargetDate &&
      Number.isNaN(parsedTargetDate.getTime())
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid targetDate",
        },
        { status: 400 },
      );
    }

    const stock = await db.stock.findUnique({
      where: { symbol },
      select: {
        id: true,
        symbol: true,
        name: true,
        market: true,
        sector: true,
      },
    });

    if (!stock) {
      return Response.json(
        {
          success: false,
          message: "Stock not found",
        },
        { status: 404 },
      );
    }

    let recommendation = null;

    if (parsedTargetDate) {
      const { start, end } = getDateRange(parsedTargetDate);

      recommendation = await db.recommendation.findFirst({
        where: {
          stockId: stock.id,
          targetDate: {
            gte: start,
            lt: end,
          },
        },
        orderBy: [
          { targetDate: "desc" },
          { createdAt: "desc" },
        ],
      });
    } else {
      recommendation = await db.recommendation.findFirst({
        where: {
          stockId: stock.id,
        },
        orderBy: [
          { targetDate: "desc" },
          { createdAt: "desc" },
        ],
      });
    }

    if (!recommendation) {
      return Response.json(
        {
          success: true,
          data: {
            stock,
            recommendation: null,
          },
        },
        { status: 200 },
      );
    }

    const recentEvents = await db.event.findMany({
      where: {
        stockId: stock.id,
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        sourceType: true,
        sourceName: true,
        eventType: true,
        title: true,
        content: true,
        summary: true,
        sourceUrl: true,
        publishedAt: true,
        score: true,
        isNoise: true,
      },
    });

    return Response.json(
      {
        success: true,
        data: {
          stock,
          recommendation: {
            id: recommendation.id,
            targetDate: recommendation.targetDate,
            totalScore: recommendation.totalScore,
            reason: recommendation.reason,
            risk: recommendation.risk,
            confidence: recommendation.confidence,
            evidence: recommendation.evidence,
            createdAt: recommendation.createdAt,
          },
          recentEvents,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/recommendations/[symbol]]", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch recommendation detail",
      },
      { status: 500 },
    );
  }
}