import type { RecommendationLlmInput } from "./recommendation-llm-schema";

export function buildRecommendationPrompt(
  input: RecommendationLlmInput,
): string {
  const eventsText = input.events
    .map(
      (event, index) =>
        `${index + 1}. 제목: ${event.title}
- 요약: ${event.summary ?? "요약 없음"}
- 이벤트 타입: ${event.eventType}
- 소스 타입: ${event.sourceType}
- 점수: ${event.score}
- 시각: ${event.publishedAt}`,
    )
    .join("\n");

  return `
너는 한국 주식 추천 서비스의 분석 엔진이다.
주어진 이벤트 데이터를 바탕으로 투자자에게 보여줄 분석 요약, 긍정 요인, 리스크를 작성하라.

[종목 정보]
- 종목명: ${input.stockName}
- 종목코드: ${input.stockSymbol}
- 시장: ${input.market}
- 섹터: ${input.sector ?? "없음"}
- 총점: ${input.totalScore}

[이벤트 목록]
${eventsText}

[작성 규칙]
1. summary는 왜 오늘 주목할 종목인지 2~3문장으로 작성
2. positives는 핵심 긍정 요인을 2~4개 배열로 작성
3. risks는 투자 시 주의할 점을 1~3개 배열로 작성
4. 과장 표현 금지
5. "무조건 상승", "확실", "100%" 같은 표현 금지
6. 이벤트 근거 기반으로만 작성
7. 한국어로 작성
8. JSON만 반환
9. 배열 각 항목은 짧고 명확하게 작성

[반환 형식]
{
  "summary": "string",
  "positives": ["string", "string"],
  "risks": ["string"]
}
`.trim();
}