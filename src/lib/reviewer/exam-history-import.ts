import type { ExamHistoryEntry } from "./exam-history";

const HEADER =
  "Completed at (ISO),Correct,Total,Percent," +
  "Mathematics,Science,English,Reasoning";

const SUBJECTS = [
  "Math",
  "Science",
  "English",
  "Reasoning",
] as const;

function signature(entry: ExamHistoryEntry): string {
  return [
    entry.completedAt,
    entry.correct,
    ...SUBJECTS.map(
      (subject) => entry.subjectScores[subject]
    ),
  ].join(":");
}

export function parseExamHistoryCsv(
  text: string
): ExamHistoryEntry[] {
  if (text.length > 65536) {
    throw new Error("CSV file is too large.");
  }

  const lines = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trimEnd()
    .split("\n");

  if (lines[0] !== HEADER) {
    throw new Error(
      "This is not an AralKit Exam History CSV."
    );
  }

  if (lines.length < 2 || lines.length > 21) {
    throw new Error(
      "CSV must contain 1 to 20 exam records."
    );
  }

  const seen = new Set<string>();

  return lines.slice(1).map((line) => {
    const fields = line.split(",");

    if (fields.length !== 8) {
      throw new Error("Invalid CSV column count.");
    }

    const dateText = fields[0];
    const completedAt = Date.parse(dateText);

    if (
      !Number.isFinite(completedAt) ||
      new Date(completedAt).toISOString() !== dateText
    ) {
      throw new Error("Invalid exam date.");
    }

    const numbers = fields.slice(1).map((field) => {
      if (!/^(0|[1-9]\d*)$/.test(field)) {
        throw new Error("Invalid numeric score.");
      }

      return Number(field);
    });

    const [
      correct,
      total,
      percent,
      math,
      science,
      english,
      reasoning,
    ] = numbers;

    const scores = [
      math,
      science,
      english,
      reasoning,
    ];

    if (
      total !== 40 ||
      correct > 40 ||
      percent !== Math.round((correct / 40) * 100) ||
      scores.some((score) => score > 10) ||
      scores.reduce((sum, score) => sum + score, 0)
        !== correct
    ) {
      throw new Error(
        "CSV scores do not match the exam total."
      );
    }

    const entry: ExamHistoryEntry = {
      id: [
        "csv",
        completedAt,
        ...scores,
      ].join("-"),
      completedAt,
      correct,
      total: 40,
      subjectScores: {
        Math: math,
        Science: science,
        English: english,
        Reasoning: reasoning,
      },
    };

    const key = signature(entry);

    if (seen.has(key)) {
      throw new Error(
        "The CSV contains duplicate exam records."
      );
    }

    seen.add(key);
    return entry;
  });
}

export function mergeExamHistory(
  existing: ExamHistoryEntry[],
  imported: ExamHistoryEntry[]
): ExamHistoryEntry[] {
  const seen = new Set<string>();

  return [...existing, ...imported]
    .sort((a, b) => b.completedAt - a.completedAt)
    .filter((entry) => {
      const key = signature(entry);

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 20);
}
