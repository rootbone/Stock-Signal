export type MarketType = "KOSPI" | "KOSDAQ" | "KONEX" | "UNKNOWN";

export type StockDto = {
  id: string;
  symbol: string;
  name: string;
  market: MarketType | string;
  sector?: string | null;
  isin?: string | null;
};