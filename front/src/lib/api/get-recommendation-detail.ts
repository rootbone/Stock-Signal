import type { RecommendationDetailResponse } from "@/types/recommendation-detail";

type Params = {
  symbol: string;
  targetDate?: string;
  baseUrl?: string;
};

export async function getRecommendationDetail({
  symbol,
  targetDate,
  baseUrl = "",
}: Params) {
  const query = targetDate
    ? `?targetDate=${encodeURIComponent(targetDate)}`
    : "";

  const response = await fetch(
    `${baseUrl}/api/recommendations/${encodeURIComponent(symbol)}${query}`,
    {
      method: "GET",
      next: { revalidate: 60 },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch recommendation detail: ${response.status}`);
  }

  const json = (await response.json()) as RecommendationDetailResponse;

  if (!json.success || !json.data) {
    throw new Error(json.message ?? "Recommendation detail not found");
  }

  return json.data;
}