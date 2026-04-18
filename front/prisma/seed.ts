// npx prisma db seed

import { db as prisma } from "@/lib/db";

function normalizeDate(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  return d;
}

function atTime(date: Date, hour: number, minute: number) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function upsertStocks() {
  const stocks = [
    {
      symbol: "005930",
      name: "삼성전자",
      market: "KOSPI",
      sector: "반도체",
      isin: "KR7005930003",
    },
    {
      symbol: "000660",
      name: "SK하이닉스",
      market: "KOSPI",
      sector: "반도체",
      isin: "KR7000660001",
    },
    {
      symbol: "035420",
      name: "NAVER",
      market: "KOSPI",
      sector: "인터넷",
      isin: "KR7035420009",
    },
    {
      symbol: "035720",
      name: "카카오",
      market: "KOSPI",
      sector: "플랫폼",
      isin: "KR7035720002",
    },
    {
      symbol: "051910",
      name: "LG화학",
      market: "KOSPI",
      sector: "2차전지",
      isin: "KR7051910008",
    },
  ];

  const saved = [];

  for (const stock of stocks) {
    const item = await prisma.stock.upsert({
      where: { symbol: stock.symbol },
      update: stock,
      create: stock,
    });

    saved.push(item);
  }

  return saved;
}

function buildMockEvents(stockId: string, symbol: string, today: Date) {
  const map: Record<string, Array<{
    sourceType: string;
    sourceName: string;
    eventType: string;
    title: string;
    content: string;
    summary: string;
    sourceUrl: string;
    publishedAt: Date;
    score: number;
  }>> = {
    "005930": [
      {
        sourceType: "NEWS",
        sourceName: "연합뉴스",
        eventType: "EARNINGS",
        title: "삼성전자 1분기 실적 기대감 확대",
        content: "메모리 업황 회복 기대와 AI 서버 수요 증가가 반영되며 실적 개선 기대가 높아지고 있다.",
        summary: "메모리 업황 회복 기대와 AI 서버 수요 증가가 반영되며 실적 개선 기대가 높아짐",
        sourceUrl: "https://example.com/news/samsung-earnings",
        publishedAt: atTime(daysAgo(today, 2), 9, 0),
        score: 78,
      },
      {
        sourceType: "DART",
        sourceName: "DART",
        eventType: "DISCLOSURE",
        title: "삼성전자 주요 공시 업데이트",
        content: "사업보고서 기준 주요 재무지표와 사업 현황 업데이트 내용이 반영되었다.",
        summary: "사업보고서 기준 핵심 재무 정보가 반영됨",
        sourceUrl: "https://example.com/dart/samsung-disclosure",
        publishedAt: atTime(daysAgo(today, 3), 10, 30),
        score: 65,
      },
      {
        sourceType: "NEWS",
        sourceName: "한국경제",
        eventType: "PRODUCT",
        title: "삼성전자 AI 반도체 기대감 부각",
        content: "차세대 AI 반도체와 고대역폭 메모리 관련 기대가 시장에서 재부각되고 있다.",
        summary: "차세대 반도체와 AI 관련 수요 확대 기대",
        sourceUrl: "https://example.com/news/samsung-ai-chip",
        publishedAt: atTime(daysAgo(today, 4), 14, 0),
        score: 74,
      },
    ],
    "000660": [
      {
        sourceType: "NEWS",
        sourceName: "매일경제",
        eventType: "CONTRACT",
        title: "SK하이닉스 HBM 공급 확대 기대",
        content: "AI 메모리 수요 증가로 HBM 공급 확대 기대감이 커지고 있다.",
        summary: "HBM 공급 확대 기대",
        sourceUrl: "https://example.com/news/skhynix-hbm",
        publishedAt: atTime(daysAgo(today, 1), 9, 20),
        score: 84,
      },
      {
        sourceType: "NEWS",
        sourceName: "한국경제",
        eventType: "EARNINGS",
        title: "SK하이닉스 실적 개선 전망",
        content: "메모리 가격 회복과 AI 수요 증가가 실적 개선 기대를 키우고 있다.",
        summary: "메모리 가격 회복에 따른 실적 개선 기대",
        sourceUrl: "https://example.com/news/skhynix-earnings",
        publishedAt: atTime(daysAgo(today, 3), 13, 10),
        score: 76,
      },
      {
        sourceType: "DART",
        sourceName: "DART",
        eventType: "DISCLOSURE",
        title: "SK하이닉스 공시 업데이트",
        content: "사업 현황 및 투자 관련 주요 공시 내용이 업데이트되었다.",
        summary: "사업 현황 관련 공시 반영",
        sourceUrl: "https://example.com/dart/skhynix-disclosure",
        publishedAt: atTime(daysAgo(today, 5), 10, 0),
        score: 62,
      },
    ],
    "035420": [
      {
        sourceType: "NEWS",
        sourceName: "서울경제",
        eventType: "PRODUCT",
        title: "NAVER AI 서비스 강화 기대",
        content: "검색과 커머스 영역에서 AI 서비스 강화가 본격화될 전망이다.",
        summary: "AI 서비스 강화 기대",
        sourceUrl: "https://example.com/news/naver-ai",
        publishedAt: atTime(daysAgo(today, 1), 11, 0),
        score: 73,
      },
      {
        sourceType: "NEWS",
        sourceName: "연합뉴스",
        eventType: "PARTNERSHIP",
        title: "NAVER 글로벌 협업 확대",
        content: "콘텐츠 및 기술 영역에서 글로벌 협업 기대감이 부각되고 있다.",
        summary: "글로벌 협업 확대 기대",
        sourceUrl: "https://example.com/news/naver-partnership",
        publishedAt: atTime(daysAgo(today, 4), 15, 20),
        score: 69,
      },
      {
        sourceType: "DART",
        sourceName: "DART",
        eventType: "DISCLOSURE",
        title: "NAVER 주요 공시 반영",
        content: "사업 구조와 투자 관련 공시 내용이 반영되었다.",
        summary: "사업 구조 관련 공시 반영",
        sourceUrl: "https://example.com/dart/naver-disclosure",
        publishedAt: atTime(daysAgo(today, 6), 9, 40),
        score: 58,
      },
    ],
    "035720": [
      {
        sourceType: "NEWS",
        sourceName: "한국경제",
        eventType: "PARTNERSHIP",
        title: "카카오 콘텐츠 협업 기대감",
        content: "콘텐츠와 플랫폼 시너지 기대가 다시 부각되고 있다.",
        summary: "콘텐츠 협업 확대 기대",
        sourceUrl: "https://example.com/news/kakao-partnership",
        publishedAt: atTime(daysAgo(today, 2), 10, 50),
        score: 68,
      },
      {
        sourceType: "NEWS",
        sourceName: "매일경제",
        eventType: "PRODUCT",
        title: "카카오 플랫폼 개편 모멘텀",
        content: "서비스 개편과 사용자 경험 개선 기대가 주가 모멘텀으로 작용하고 있다.",
        summary: "플랫폼 개편 모멘텀",
        sourceUrl: "https://example.com/news/kakao-product",
        publishedAt: atTime(daysAgo(today, 4), 16, 10),
        score: 64,
      },
      {
        sourceType: "DART",
        sourceName: "DART",
        eventType: "DISCLOSURE",
        title: "카카오 공시 업데이트",
        content: "주요 사업 관련 공시 업데이트가 반영되었다.",
        summary: "사업 관련 공시 반영",
        sourceUrl: "https://example.com/dart/kakao-disclosure",
        publishedAt: atTime(daysAgo(today, 5), 9, 5),
        score: 57,
      },
    ],
    "051910": [
      {
        sourceType: "NEWS",
        sourceName: "서울경제",
        eventType: "CONTRACT",
        title: "LG화학 배터리 소재 수주 기대",
        content: "배터리 소재 공급 확대 기대가 반영되며 투자심리가 개선되고 있다.",
        summary: "배터리 소재 수주 기대",
        sourceUrl: "https://example.com/news/lgchem-contract",
        publishedAt: atTime(daysAgo(today, 1), 8, 45),
        score: 80,
      },
      {
        sourceType: "NEWS",
        sourceName: "연합뉴스",
        eventType: "PRODUCT",
        title: "LG화학 첨단소재 성장 기대",
        content: "첨단소재 사업의 성장 기대와 수익성 개선 전망이 확대되고 있다.",
        summary: "첨단소재 성장 기대",
        sourceUrl: "https://example.com/news/lgchem-product",
        publishedAt: atTime(daysAgo(today, 3), 14, 30),
        score: 72,
      },
      {
        sourceType: "DART",
        sourceName: "DART",
        eventType: "DISCLOSURE",
        title: "LG화학 공시 업데이트",
        content: "주요 투자와 사업 현황 관련 공시가 반영되었다.",
        summary: "투자 및 사업 현황 공시 반영",
        sourceUrl: "https://example.com/dart/lgchem-disclosure",
        publishedAt: atTime(daysAgo(today, 6), 10, 15),
        score: 61,
      },
    ],
  };

  return (map[symbol] ?? []).map((item) => ({
    stockId,
    sourceType: item.sourceType,
    sourceName: item.sourceName,
    eventType: item.eventType,
    title: item.title,
    content: item.content,
    summary: item.summary,
    sourceUrl: item.sourceUrl,
    publishedAt: item.publishedAt,
    score: item.score,
    isNoise: false,
    rawJson: {
      type: "mock",
      symbol,
      tag: item.eventType.toLowerCase(),
    },
  }));
}

function buildRecommendationHistory(stockId: string, stockName: string, symbol: string, today: Date) {
  const baseMap: Record<string, { scores: number[]; confidence: number[]; positive: string[]; risks: string[] }> = {
    "005930": {
      scores: [66, 69, 71, 74, 76, 78, 81],
      confidence: [0.62, 0.64, 0.67, 0.7, 0.72, 0.75, 0.79],
      positive: ["AI 수요 증가", "메모리 업황 회복", "실적 기대"],
      risks: ["단기 조정 가능성", "고점 부담"],
    },
    "000660": {
      scores: [68, 71, 74, 77, 80, 82, 85],
      confidence: [0.63, 0.66, 0.69, 0.72, 0.75, 0.78, 0.82],
      positive: ["HBM 수요 증가", "메모리 가격 회복", "실적 개선 기대"],
      risks: ["단기 변동성", "업황 민감도"],
    },
    "035420": {
      scores: [55, 58, 61, 64, 66, 68, 70],
      confidence: [0.54, 0.57, 0.59, 0.61, 0.64, 0.66, 0.68],
      positive: ["AI 서비스 기대", "글로벌 협업", "광고/커머스 개선"],
      risks: ["성장주 변동성", "투자비 증가"],
    },
    "035720": {
      scores: [48, 51, 54, 57, 59, 61, 63],
      confidence: [0.5, 0.53, 0.55, 0.57, 0.59, 0.61, 0.63],
      positive: ["플랫폼 개편", "콘텐츠 협업", "서비스 개선 기대"],
      risks: ["수익성 회복 속도", "시장 경쟁"],
    },
    "051910": {
      scores: [60, 63, 67, 70, 73, 76, 79],
      confidence: [0.58, 0.61, 0.65, 0.68, 0.71, 0.74, 0.77],
      positive: ["배터리 소재 기대", "첨단소재 성장", "수주 확대"],
      risks: ["원자재 가격", "업황 변동성"],
    },
  };

  const config = baseMap[symbol];

  return config.scores.map((score, index) => {
    const targetDate = normalizeDate(daysAgo(today, 6 - index));

    return {
      stockId,
      targetDate,
      totalScore: score,
      reason: `${stockName} 관련 주요 이벤트 흐름이 점진적으로 반영되었습니다.`,
      risk: config.risks[0],
      confidence: config.confidence[index],
      evidence: {
        analysis: {
          summary: `${stockName}의 최근 이벤트와 시장 기대가 누적 반영되며 점수가 형성되었습니다.`,
          positives: config.positive,
          risks: config.risks,
        },
        topEvents: [
          {
            title: `${stockName} 핵심 이벤트`,
            summary: `${stockName} 관련 주요 이벤트가 추천 점수에 반영되었습니다.`,
            eventType: "EVENT",
            sourceType: "NEWS",
            sourceName: "MOCK",
            score,
            publishedAt: targetDate.toISOString(),
          },
        ],
        metrics: {
          totalEvents: 3,
          positiveEvents: 2,
          negativeEvents: 1,
        },
      },
    };
  });
}

async function main() {
  const today = normalizeDate(new Date());

  const stocks = await upsertStocks();

  for (const stock of stocks) {
    await prisma.event.deleteMany({
      where: { stockId: stock.id },
    });

    const events = buildMockEvents(stock.id, stock.symbol, today);

    if (events.length > 0) {
      await prisma.event.createMany({
        data: events,
      });
    }

    await prisma.recommendation.deleteMany({
      where: { stockId: stock.id },
    });

    const recommendations = buildRecommendationHistory(
      stock.id,
      stock.name,
      stock.symbol,
      today
    );

    await prisma.recommendation.createMany({
      data: recommendations,
    });
  }

  console.log("✅ seed completed");
  console.log(`stocks: ${stocks.length} created/updated`);
  console.log("events: created for 5 stocks");
  console.log("recommendations: 7 days x 5 stocks created");
}

main()
  .catch((error) => {
    console.error("❌ seed failed");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });