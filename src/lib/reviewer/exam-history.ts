export const EXAM_HISTORY_KEY =
  "aralkit.mock-exam.history.v1";

export const MAX_EXAM_HISTORY = 20;

type Subject = "Math" | "Science" | "English" | "Reasoning";

export type ExamHistoryEntry = {
  id: string;
  completedAt: number;
  correct: number;
  total: 40;
  subjectScores: Record<Subject, number>;
};

type ReadableStorage = {
  getItem(key: string): string | null;
};

type WritableStorage = ReadableStorage & {
  setItem(key: string, value: string): void;
};

const SUBJECTS: Subject[] = [
  "Math",
  "Science",
  "English",
  "Reasoning",
];

function isHistoryEntry(value: unknown): value is ExamHistoryEntry {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const entry = value as Record<string, unknown>;

  if (
    typeof entry.id !== "string" ||
    entry.id.length === 0 ||
    entry.id.length > 128 ||
    typeof entry.completedAt !== "number" ||
    !Number.isFinite(entry.completedAt) ||
    entry.completedAt <= 0 ||
    entry.total !== 40 ||
    typeof entry.correct !== "number" ||
    !Number.isInteger(entry.correct) ||
    entry.correct < 0 ||
    entry.correct > 40 ||
    !entry.subjectScores ||
    typeof entry.subjectScores !== "object" ||
    Array.isArray(entry.subjectScores)
  ) {
    return false;
  }

  const scores = entry.subjectScores as Record<
    string,
    unknown
  >;

  if (
    !SUBJECTS.every((subject) => {
      const score = scores[subject];

      return (
        typeof score === "number" &&
        Number.isInteger(score) &&
        score >= 0 &&
        score <= 10
      );
    })
  ) {
    return false;
  }

  return SUBJECTS.reduce(
    (total, subject) =>
      total + (scores[subject] as number),
    0
  ) === entry.correct;
}

export function readExamHistory(
  storage: ReadableStorage
): ExamHistoryEntry[] {
  try {
    const raw = storage.getItem(EXAM_HISTORY_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seen = new Set<string>();

    return parsed
      .filter(isHistoryEntry)
      .sort(
        (a, b) => b.completedAt - a.completedAt
      )
      .filter((entry) => {
        if (seen.has(entry.id)) return false;
        seen.add(entry.id);
        return true;
      })
      .slice(0, MAX_EXAM_HISTORY);
  } catch {
    return [];
  }
}

export function saveExamHistory(
  storage: WritableStorage,
  entry: ExamHistoryEntry
): ExamHistoryEntry[] {
  if (!isHistoryEntry(entry)) {
    throw new Error("Invalid exam history entry.");
  }

  const previous = readExamHistory(storage);

  // Keep the original completion time if a restored result
  // is saved again after a page refresh.
  const existing = previous.find(
    (item) => item.id === entry.id
  );

  const next = [
    existing ?? entry,
    ...previous.filter((item) => item.id !== entry.id),
  ]
    .sort(
      (a, b) => b.completedAt - a.completedAt
    )
    .slice(0, MAX_EXAM_HISTORY);

  storage.setItem(
    EXAM_HISTORY_KEY,
    JSON.stringify(next)
  );

  return next;
}
