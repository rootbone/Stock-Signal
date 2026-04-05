import {
  StockRepository,
  UpsertStockInput,
} from "../repositories/stock-repository";

export class StockService {
  private stockRepository: StockRepository;

  constructor() {
    this.stockRepository = new StockRepository();
  }

  /**
   * mock 데이터 (초기 단계)
   */
  private getMockStocks(): UpsertStockInput[] {
    return [
      { symbol: "005930", name: "삼성전자", market: "KOSPI" },
      { symbol: "000660", name: "SK하이닉스", market: "KOSPI" },
      { symbol: "035420", name: "NAVER", market: "KOSPI" },
      { symbol: "035720", name: "카카오", market: "KOSPI" },
      { symbol: "051910", name: "LG화학", market: "KOSPI" },
    ];
  }

  async ingestStocks() {
    try {
      const stocks = this.getMockStocks();

      if (!stocks || stocks.length === 0) {
        throw new Error("No stock data to ingest");
      }

      const result = await this.stockRepository.upsertStocks(stocks);

      return {
        count: result.length,
        data: result,
      };
    } catch (error) {
      console.error("[StockService] ingestStocks error:", error);
      throw error;
    }
  }
}