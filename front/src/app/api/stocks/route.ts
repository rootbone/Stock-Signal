import { NextResponse } from "next/server";
import { StockService } from "@/server/services/stock-service";

export async function POST() {
  const service = new StockService();

  try {
    const result = await service.ingestStocks();

    return NextResponse.json(
      {
        success: true,
        message: "Stocks ingested successfully",
        ...result,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[API] /api/ingest/stocks error:", error);

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