import { RawDisclosure } from "../clients/disclosure-client";

export type NormalizedEvent = {
  symbol: string;
  sourceType: string;
  sourceName: string;
  eventType: string;
  title: string;
  content?: string;
  summary?: string;
  publishedAt: Date;
};

export class EventNormalizer {
  static normalize(data: RawDisclosure[]): NormalizedEvent[] {
    return data
      .map((item): NormalizedEvent | null => {
        const title = item.title;

        if (title.includes("공급계약")) {
          return {
            symbol: item.symbol,
            sourceType: "DISCLOSURE",
            sourceName: "DART",
            eventType: "CONTRACT",
            title,
            content: item.content,
            summary: "수주 계약",
            publishedAt: new Date(item.publishedAt),
          };
        }

        if (title.includes("영업이익") || title.includes("실적")) {
          return {
            symbol: item.symbol,
            sourceType: "DISCLOSURE",
            sourceName: "DART",
            eventType: "EARNINGS",
            title,
            content: item.content,
            summary: "실적 발표",
            publishedAt: new Date(item.publishedAt),
          };
        }

        return null;
      })
      .filter((v): v is NormalizedEvent => v !== null);
  }
}