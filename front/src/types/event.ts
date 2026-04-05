export type SourceType = "DISCLOSURE" | "NEWS" | "PROFILE";

export type EventType =
  | "CONTRACT_DISCLOSURE"
  | "EARNINGS_SURPRISE"
  | "BUYBACK"
  | "DIVIDEND"
  | "POLICY_BENEFIT"
  | "NEWS_NOISE"
  | "UNKNOWN";

export type EventDto = {
  id: string;
  stockId?: string | null;
  sourceType: SourceType | string;
  sourceName: string;
  eventType: EventType | string;
  title: string;
  content?: string | null;
  summary?: string | null;
  sourceUrl?: string | null;
  publishedAt: string;
  score: number;
  isNoise: boolean;
};