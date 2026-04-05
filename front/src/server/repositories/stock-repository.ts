import { Stock } from "@prisma/client";
import { db } from "@/lib/db";

export type UpsertStockInput = {
  symbol: string;
  name: string;
  market: string;
  sector?: string;
  isin?: string;
};

export class StockRepository {
  async upsertStocks(stocks: UpsertStockInput[]): Promise<Stock[]> {
    try {
      const results: Stock[] = [];

      for (const stock of stocks) {
        const saved = await db.stock.upsert({
          where: {
            symbol: stock.symbol,
          },
          update: {
            name: stock.name,
            market: stock.market,
            sector: stock.sector,
            isin: stock.isin,
          },
          create: {
            symbol: stock.symbol,
            name: stock.name,
            market: stock.market,
            sector: stock.sector,
            isin: stock.isin,
          },
        });

        results.push(saved);
      }

      return results;
    } catch (error: unknown) {
      console.error("[StockRepository] upsertStocks error:", error);

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      throw new Error("Failed to upsert stocks");
    }
  }

  async findBySymbols(symbols: string[]): Promise<Stock[]> {
    try {
      return await db.stock.findMany({
        where: {
          symbol: {
            in: symbols,
          },
        },
      });
    } catch (error: unknown) {
      console.error("[StockRepository] findBySymbols error:", error);

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      throw new Error("Failed to find stocks by symbols");
    }
  }
}