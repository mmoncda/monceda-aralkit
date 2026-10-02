import type { ExamHistoryEntry } from "./exam-history";

export type ExamTrendPoint = {
  id: string;
  completedAt: number;
  correct: number;
  percent: number;
};

export function buildExamTrend(
  history: ExamHistoryEntry[]
): ExamTrendPoint[] {
  return [...history]
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, 10)
    .reverse()
    .map((entry) => ({
      id: entry.id,
      completedAt: entry.completedAt,
      correct: entry.correct,
      percent: Math.round(
        (entry.correct / entry.total) * 100
      ),
    }));
}
