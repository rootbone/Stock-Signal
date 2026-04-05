import OpenAI from "openai";
import { env } from "@/lib/env";
import { buildRecommendationPrompt } from "./recommendation-llm-prompt";
import type {
  RecommendationLlmInput,
  RecommendationLlmOutput,
} from "./recommendation-llm-schema";

export class LLMService {
  private readonly client: OpenAI | null;

  constructor() {
    this.client = env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
      : null;
  }

  async generateRecommendationInsight(
    input: RecommendationLlmInput,
  ): Promise<RecommendationLlmOutput> {
    if (!this.client) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const prompt = buildRecommendationPrompt(input);

    const response = await this.client.responses.create({
      model: env.OPENAI_MODEL,
      input: prompt,
    });

    const text = extractTextFromResponse(response);

    const parsed = safeParseRecommendationOutput(text);
    if (!parsed) {
      throw new Error("Failed to parse LLM recommendation output");
    }

    return parsed;
  }
}

function extractTextFromResponse(response: OpenAI.Responses.Response): string {
  const outputText = response.output_text;
  if (outputText && outputText.trim().length > 0) {
    return outputText.trim();
  }

  throw new Error("LLM returned empty output");
}

function safeParseRecommendationOutput(
  text: string,
): RecommendationLlmOutput | null {
  try {
    const parsed = JSON.parse(text) as Partial<RecommendationLlmOutput>;

    const summary =
      typeof parsed.summary === "string" ? parsed.summary.trim() : "";

    const positives = normalizeStringArray(parsed.positives);
    const risks = normalizeStringArray(parsed.risks);

    if (summary.length === 0) {
      return null;
    }

    return {
      summary,
      positives,
      risks,
    };
  } catch {
    return null;
  }
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export const llmService = new LLMService();