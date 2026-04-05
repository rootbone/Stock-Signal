export type RecommendationDto = {
  id: string;
  stockId: string;
  targetDate: string;
  totalScore: number;
  reason: string;
  risk?: string | null;
  evidence?: unknown;
  confidence?: number | null;
};