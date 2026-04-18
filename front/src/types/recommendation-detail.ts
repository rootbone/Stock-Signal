export type RecommendationDetailStock = {
  id: string;
  symbol: string;
  name: string;
  market: string;
  sector: string | null;
};

export type RecommendationDetailTopEvent = {
  title: string;
  eventType: string;
  sourceType: string;
  sourceName?: string;
  score: number;
  publishedAt: string;
  summary?: string | null;
  baseScore?: number;
  typeWeight?: number;
  sourceWeight?: number;
  freshnessWeight?: number;
};

export type RecommendationDetailEvidence = {
  analysis?: {
    summary?: string;
    positives?: string[];
    risks?: string[];
  };
  topEvents?: RecommendationDetailTopEvent[];
  metrics?: {
    totalEvents?: number;
    positiveEvents?: number;
    negativeEvents?: number;
    rawEventCount?: number;
    activeEventCount?: number;
    noiseCount?: number;
    averageFreshnessWeight?: number;
  };
  scoring?: {
    formula?: string;
    version?: string;
  };
};

export type RecommendationDetailItem = {
  id: string;
  targetDate: string;
  totalScore: number;
  reason: string;
  risk: string | null;
  confidence: number | null;
  evidence: RecommendationDetailEvidence | null;
  createdAt: string;
};

export type RecommendationDetailRecentEvent = {
  id: string;
  sourceType: string;
  sourceName: string;
  eventType: string;
  title: string;
  content: string | null;
  summary: string | null;
  sourceUrl: string | null;
  publishedAt: string;
  score: number;
  isNoise: boolean;
};

export type RecommendationDetailResponse = {
  success: boolean;
  data?: {
    stock: RecommendationDetailStock;
    recommendation: RecommendationDetailItem | null;
    recentEvents: RecommendationDetailRecentEvent[];
  };
  message?: string;
};