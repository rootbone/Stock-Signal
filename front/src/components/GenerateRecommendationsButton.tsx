"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function GenerateRecommendationsButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>("");

  const handleGenerate = async () => {
    setMessage("");

    try {
      const response = await fetch("/api/recommendations/generate", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message ?? "추천 생성에 실패했습니다.");
        return;
      }

      setMessage(
        `추천 생성 완료: ${result.createdCount ?? 0}건 생성됨`
      );

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      setMessage("추천 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-[var(--foreground)]">
            추천 재생성
          </div>
          <div className="mt-1 text-sm text-[var(--muted-foreground)]">
            현재 이벤트 기준으로 오늘 추천을 다시 계산합니다.
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "생성 중..." : "추천 생성 실행"}
        </button>
      </div>

      {message ? (
        <div className="mt-3 text-sm text-[var(--muted-foreground)]">
          {message}
        </div>
      ) : null}
    </div>
  );
}