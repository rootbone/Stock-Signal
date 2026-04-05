import { db } from "@/lib/db";
import { Event, Prisma } from "@prisma/client";

export type CreateEventInput = {
  stockId?: string;
  sourceType: string;
  sourceName: string;
  eventType: string;
  title: string;
  content?: string;
  summary?: string;
  sourceUrl?: string;
  publishedAt: Date;
  score?: number;
  isNoise?: boolean;
  rawJson?: Prisma.InputJsonValue;
};

export class EventRepository {
  async createEvents(items: CreateEventInput[]): Promise<Event[]> {
    try {
      return await db.$transaction(
        items.map((item) => {
          const data: Prisma.EventUncheckedCreateInput = {
            sourceType: item.sourceType,
            sourceName: item.sourceName,
            eventType: item.eventType,
            title: item.title,
            content: item.content,
            summary: item.summary,
            sourceUrl: item.sourceUrl,
            publishedAt: item.publishedAt,
            score: item.score ?? 0,
            isNoise: item.isNoise ?? false,
            rawJson: item.rawJson,
            ...(item.stockId ? { stockId: item.stockId } : {}),
          };

          return db.event.create({ data });
        })
      );
    } catch (error: unknown) {
      console.error("[EventRepository] error:", error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to create events");
    }
  }
}