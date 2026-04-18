"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  data: {
    date: string;
    score: number;
  }[];
};

function getScoreDelta(data: { date: string; score: number }[]) {
  if (data.length < 2) return 0;
  return data[data.length - 1]!.score - data[0]!.score;
}

export default function ScoreChart({ data }: Props) {
  const safeData =
    data.length === 1
      ? [
          {
            date: `${data[0]!.date} `,
            score: data[0]!.score,
          },
          data[0]!,
        ]
      : data;

  const stats = useMemo(() => {
    const scores = safeData.map((item) => item.score);
    const latest = scores.at(-1) ?? 0;
    const highest = scores.length ? Math.max(...scores) : 0;
    const lowest = scores.length ? Math.min(...scores) : 0;
    const delta = getScoreDelta(safeData);

    return { latest, highest, lowest, delta };
  }, [safeData]);

  if (safeData.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted-foreground)]">
        차트 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <MiniStat label="현재 점수" value={stats.latest.toFixed(1)} strong />
        <MiniStat label="최고 점수" value={stats.highest.toFixed(1)} />
        <MiniStat label="최저 점수" value={stats.lowest.toFixed(1)} />
        <MiniDeltaStat value={stats.delta} />
      </div>

      <div className="h-80 w-full rounded-[24px] border border-[var(--border)] bg-[var(--background)] p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={safeData}
            margin={{ top: 16, right: 12, left: -12, bottom: 4 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              vertical={false}
              opacity={0.6}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={{ stroke: "var(--border)" }}
              width={40}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--primary)"
              strokeWidth={2.75}
              dot={{
                r: 3,
                fill: "var(--primary)",
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill: "var(--primary)",
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
        {label}
      </div>
      <div
        className={`mt-2 text-xl font-semibold tracking-tight ${
          strong ? "text-[var(--primary)]" : "text-[var(--foreground)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function MiniDeltaStat({ value }: { value: number }) {
  const positive = value >= 0;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
        변화폭
      </div>
      <div
        className={`mt-2 text-xl font-semibold tracking-tight ${
          positive ? "text-[var(--positive)]" : "text-[var(--negative)]"
        }`}
      >
        {positive ? "+" : ""}
        {value.toFixed(1)}
      </div>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const value = payload[0]?.value ?? 0;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 shadow-lg">
      <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-[var(--foreground)]">
        Score {Number(value).toFixed(1)}
      </div>
    </div>
  );
}