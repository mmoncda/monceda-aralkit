import type { Answers, Question } from "./quiz";

export type ReviewMode = "incorrect" | "all";
export type ReviewSubject = "All" | Question["subject"];

export function filterMockExamReview(
  questions: Question[],
  answers: Answers,
  mode: ReviewMode,
  subject: ReviewSubject
): { item: Question; index: number }[] {
  return questions
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      const matchesSubject =
        subject === "All" || item.subject === subject;

      const matchesMode =
        mode === "all" || answers[item.id] !== item.answer;

      return matchesSubject && matchesMode;
    });
}
