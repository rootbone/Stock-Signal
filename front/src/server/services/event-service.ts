import { DisclosureClient } from "../clients/disclosure-client";
import { EventNormalizer } from "./event-normalizer";
import { EventRepository } from "../repositories/event-repository";
import { StockRepository } from "../repositories/stock-repository";

export class EventService {
  private client = new DisclosureClient();
  private eventRepo = new EventRepository();
  private stockRepo = new StockRepository();

  async ingestEvents() {
    try {
      const raw = await this.client.fetch();

      const normalized = EventNormalizer.normalize(raw);

      if (normalized.length === 0) {
        return { count: 0, data: [] };
      }

      const symbols = [...new Set(normalized.map((e) => e.symbol))];

      const stocks = await this.stockRepo.findBySymbols(symbols);

      const stockMap = new Map(
        stocks.map((s) => [s.symbol, s.id])
      );

      const createInputs = normalized.map((e) => ({
        stockId: stockMap.get(e.symbol),
        sourceType: e.sourceType,
        sourceName: e.sourceName,
        eventType: e.eventType,
        title: e.title,
        content: e.content,
        summary: e.summary,
        publishedAt: e.publishedAt,
        rawJson: e,
      }));

      const saved = await this.eventRepo.createEvents(createInputs);

      return {
        count: saved.length,
        data: saved,
      };
    } catch (error: unknown) {
      console.error("[EventService] error:", error);

      if (error instanceof Error) throw error;
      throw new Error("Event ingestion failed");
    }
  }
}