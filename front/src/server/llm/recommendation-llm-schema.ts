export type RecommendationLlmInput = {
  stockName: string;
  stockSymbol: string;
  market: string;
  sector?: string | null;
  totalScore: number;
  events: {
    title: string;
    summary?: string | null;
    eventType: string;
    sourceType: string;
    score: number;
    publishedAt: string;
  }[];
};

export type RecommendationLlmOutput = {
  summary: string;
  positives: string[];
  risks: string[];
};