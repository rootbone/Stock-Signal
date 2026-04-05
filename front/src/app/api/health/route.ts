import { NextResponse } from "next/server";
import { ok } from "@/lib/response";

export async function GET() {
  return NextResponse.json(
    ok({
      message: "Stock Signal API is running",
      timestamp: new Date().toISOString(),
    })
  );
}