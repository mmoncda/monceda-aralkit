import type { ExamHistoryEntry } from "./exam-history";

export type TrendSubject =
  | "All"
  | keyof ExamHistoryEntry["subjectScores"];

export type SubjectTrendPoint = {
  id: string;
  completedAt: number;
  correct: number;
  total: 10 | 40;
  percent: number;
};

export function buildSubjectTrend(
  history: ExamHistoryEntry[],
  subject: TrendSubject
): SubjectTrendPoint[] {
  return [...history]
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, 10)
    .reverse()
    .map((entry) => {
      const total = subject === "All" ? 40 : 10;
      const correct =
        subject === "All"
          ? entry.correct
          : entry.subjectScores[subject];

      return {
        id: entry.id,
        completedAt: entry.completedAt,
        correct,
        total,
        percent: Math.round((correct / total) * 100),
      };
    });
}
