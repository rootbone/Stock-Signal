export type RawDisclosure = {
  symbol: string;
  title: string;
  content: string;
  publishedAt: string;
};

export class DisclosureClient {
  async fetch(): Promise<RawDisclosure[]> {
    return [
      {
        symbol: "005930",
        title: "삼성전자 공급계약 체결",
        content: "...",
        publishedAt: new Date().toISOString(),
      },
      {
        symbol: "000660",
        title: "SK하이닉스 영업이익 발표",
        content: "...",
        publishedAt: new Date().toISOString(),
      },
    ];
  }
}