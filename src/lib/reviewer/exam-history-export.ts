import type { ExamHistoryEntry } from "./exam-history";

const HEADER = [
  "Completed at (ISO)",
  "Correct",
  "Total",
  "Percent",
  "Mathematics",
  "Science",
  "English",
  "Reasoning",
].join(",");

export function createExamHistoryCsv(
  history: ExamHistoryEntry[]
): string {
  const entries = [...history]
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, 20);

  const rows = entries.map((entry) => {
    const date = new Date(entry.completedAt);

    const completedAt = Number.isNaN(date.getTime())
      ? ""
      : date.toISOString();

    return [
      completedAt,
      entry.correct,
      entry.total,
      Math.round(
        (entry.correct / entry.total) * 100
      ),
      entry.subjectScores.Math,
      entry.subjectScores.Science,
      entry.subjectScores.English,
      entry.subjectScores.Reasoning,
    ].join(",");
  });

  return [HEADER, ...rows].join("\r\n") + "\r\n";
}
