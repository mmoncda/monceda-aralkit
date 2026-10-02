import type { ExamHistoryEntry } from "./exam-history";

type Subject = keyof ExamHistoryEntry["subjectScores"];

const SUBJECTS: Subject[] = [
  "Math",
  "Science",
  "English",
  "Reasoning",
];

export function chooseStudyFocus(
  history: ExamHistoryEntry[]
): Subject | null {
  if (history.length === 0) return null;

  let focus: Subject = SUBJECTS[0];
  let lowestTotal = Infinity;

  for (const subject of SUBJECTS) {
    const total = history.reduce(
      (sum, attempt) =>
        sum + attempt.subjectScores[subject],
      0
    );

    if (total < lowestTotal) {
      lowestTotal = total;
      focus = subject;
    }
  }

  return focus;
}
