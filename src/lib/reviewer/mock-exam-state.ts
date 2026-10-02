import type { Answers, Question } from "./quiz";

export type RestoredMockExam = {
  phase: "exam" | "result";
  questions: Question[];
  answers: Answers;
  current: number;
  deadline: number;
};

export function parseSavedMockExam(
  raw: string,
  bank: Question[],
  now: number
): RestoredMockExam | null {
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;

    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      value.version !== 1 ||
      (value.phase !== "exam" && value.phase !== "result") ||
      typeof value.current !== "number" ||
      !Number.isInteger(value.current) ||
      value.current < 0 ||
      value.current >= 40 ||
      typeof value.deadline !== "number" ||
      !Number.isFinite(value.deadline) ||
      value.deadline <= 0 ||
      value.deadline > now + 61 * 60 * 1000 ||
      !Array.isArray(value.questionIds) ||
      value.questionIds.length !== 40 ||
      !value.questionIds.every(
        (id: unknown) => typeof id === "string"
      ) ||
      !value.answers ||
      typeof value.answers !== "object" ||
      Array.isArray(value.answers)
    ) return null;

    const ids = value.questionIds as string[];
    if (new Set(ids).size !== 40) return null;

    const lookup = new Map(bank.map((q) => [q.id, q]));
    const questions: Question[] = [];

    for (const id of ids) {
      const question = lookup.get(id);
      if (!question) return null;
      questions.push(question);
    }

    for (const subject of [
      "Math", "Science", "English", "Reasoning"
    ]) {
      if (
        questions.filter((q) => q.subject === subject).length
        !== 10
      ) return null;
    }

    const answers: Answers = {};

    for (const [id, selected] of Object.entries(
      value.answers as Record<string, unknown>
    )) {
      const question = lookup.get(id);

      if (
        !ids.includes(id) ||
        !question ||
        typeof selected !== "number" ||
        !Number.isInteger(selected) ||
        selected < 0 ||
        selected >= question.options.length
      ) return null;

      answers[id] = selected;
    }

    return {
      phase: value.phase,
      questions,
      answers,
      current: value.current,
      deadline: value.deadline,
    };
  } catch {
    return null;
  }
}
