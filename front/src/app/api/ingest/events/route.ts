import { NextResponse } from "next/server";
import { EventService } from "@/server/services/event-service";

export async function POST() {
  const service = new EventService();

  try {
    const result = await service.ingestEvents();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
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