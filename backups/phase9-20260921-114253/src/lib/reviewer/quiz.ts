export type Subject =
  | "Math"
  | "Science"
  | "English"
  | "Reasoning";

export type Question = {
  id: string;
  subject: Subject;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type Answers = Record<string, number>;

const distribution: Record<Subject, number> = {
  Math: 4,
  Science: 4,
  English: 4,
  Reasoning: 3,
};

export function shuffle<T>(
  items: T[],
  random: () => number = Math.random
): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

export function buildSession(
  bank: Question[],
  random: () => number = Math.random
): Question[] {
  const selected: Question[] = [];

  for (const subject of Object.keys(
    distribution
  ) as Subject[]) {
    const candidates = bank.filter(
      (question) => question.subject === subject
    );

    const needed = distribution[subject];

    if (candidates.length < needed) {
      throw new Error(
        `Insufficient questions for ${subject}`
      );
    }

    selected.push(
      ...shuffle(candidates, random).slice(
        0,
        needed
      )
    );
  }

  return shuffle(selected, random);
}

export function gradeSession(
  questions: Question[],
  answers: Answers
) {
  const correct = questions.filter(
    (question) =>
      answers[question.id] === question.answer
  ).length;

  const total = questions.length;

  const wrongIds = questions
    .filter(
      (question) =>
        answers[question.id] !== question.answer
    )
    .map((question) => question.id);

  return {
    correct,
    total,
    percent: total
      ? Math.round((correct / total) * 100)
      : 0,
    wrongIds,
  };
}
