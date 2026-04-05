import { NextRequest } from "next/server";
import { recommendationService } from "@/server/services/recommendation-service";

interface DailyRecommendationRequestBody {
  targetDate?: string;
  lookbackDays?: number;
  limit?: number;
  minScore?: number;
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const searchParams = request.nextUrl.searchParams;

    const targetDateParam = searchParams.get("targetDate");
    const limitParam = searchParams.get("limit");

    const targetDate = targetDateParam ? new Date(targetDateParam) : undefined;
    const limit = limitParam ? Number(limitParam) : 10;

    if (targetDate && Number.isNaN(targetDate.getTime())) {
      return Response.json(
        {
          success: false,
          message: "Invalid targetDate",
        },
        { status: 400 },
      );
    }

    if (Number.isNaN(limit) || limit <= 0) {
      return Response.json(
        {
          success: false,
          message: "Invalid limit",
        },
        { status: 400 },
      );
    }

    const result = await recommendationService.getDailyRecommendations(
      targetDate,
      limit,
    );

    if (!result) {
      return Response.json(
        {
          success: true,
          data: {
            targetDate: targetDate?.toISOString() ?? null,
            items: [],
          },
        },
        { status: 200 },
      );
    }

    return Response.json(
      {
        success: true,
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/recommendations/daily]", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch daily recommendations",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = (await request.json()) as DailyRecommendationRequestBody;

    const targetDate = body.targetDate ? new Date(body.targetDate) : undefined;
    const lookbackDays = body.lookbackDays ?? 14;
    const limit = body.limit ?? 10;
    const minScore = body.minScore ?? 20;

    if (targetDate && Number.isNaN(targetDate.getTime())) {
      return Response.json(
        {
          success: false,
          message: "Invalid targetDate",
        },
        { status: 400 },
      );
    }

    if (!Number.isInteger(lookbackDays) || lookbackDays <= 0) {
      return Response.json(
        {
          success: false,
          message: "Invalid lookbackDays",
        },
        { status: 400 },
      );
    }

    if (!Number.isInteger(limit) || limit <= 0) {
      return Response.json(
        {
          success: false,
          message: "Invalid limit",
        },
        { status: 400 },
      );
    }

    if (typeof minScore !== "number" || Number.isNaN(minScore) || minScore < 0) {
      return Response.json(
        {
          success: false,
          message: "Invalid minScore",
        },
        { status: 400 },
      );
    }

    const result = await recommendationService.generateDailyRecommendations({
      targetDate,
      lookbackDays,
      limit,
      minScore,
    });

    return Response.json(
      {
        success: true,
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/recommendations/daily]", error);

    return Response.json(
      {
        success: false,
        message: "Failed to generate daily recommendations",
      },
      { status: 500 },
    );
  }
}