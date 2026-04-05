import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const stock = await db.stock.upsert({
    where: { symbol: "005930" },
    update: {},
    create: {
      symbol: "005930",
      name: "삼성전자",
      market: "KOSPI",
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 과거 7일 데이터 생성
  const data = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);

    return {
      stockId: stock.id,
      targetDate: d,
      totalScore: Math.random() * 100,
      reason: "AI 추천 테스트",
      risk: "단기 변동성 존재",
      evidence: {},
      confidence: Math.random(),
    };
  });

  await db.recommendation.createMany({
    data,
  });

  return NextResponse.json({ ok: true });
}