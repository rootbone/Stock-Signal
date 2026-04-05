import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DART_API_KEY: z.string().optional(),
  NAVER_CLIENT_ID: z.string().optional(),
  NAVER_CLIENT_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  APP_ENV: z.string().default("local"),
});

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  APP_ENV: process.env.APP_ENV ?? "development",

  DART_API_KEY: process.env.DART_API_KEY,
  NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID,
  NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET,

  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
};
