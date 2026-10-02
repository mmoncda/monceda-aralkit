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

export type SubjectSelection = Subject | "Mixed";

export const SUBJECTS: Subject[] = [
  "Math",
  "Science",
  "English",
  "Reasoning",
];

export const QUESTION_COUNTS = [10, 15, 25, 40] as const;
export type QuestionCount = (typeof QUESTION_COUNTS)[number];

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
  count: QuestionCount = 15,
  subject: SubjectSelection = "Mixed",
  random: () => number = Math.random
): Question[] {
  if (!QUESTION_COUNTS.includes(count)) {
    throw new Error(`Unsupported question count: ${count}`);
  }

  if (subject !== "Mixed") {
    const candidates = bank.filter(
      (question) => question.subject === subject
    );

    if (candidates.length < count) {
      throw new Error(`Insufficient questions for ${subject}`);
    }

    return shuffle(candidates, random).slice(0, count);
  }

  const selected: Question[] = [];
  const baseCount = Math.floor(count / SUBJECTS.length);
  const remainder = count % SUBJECTS.length;

  for (const [index, mixedSubject] of SUBJECTS.entries()) {
    const candidates = bank.filter(
      (question) => question.subject === mixedSubject
    );

    const needed = baseCount + (index < remainder ? 1 : 0);

    if (candidates.length < needed) {
      throw new Error(
        `Insufficient questions for ${mixedSubject}`
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

  const perSubject = Object.fromEntries(
    SUBJECTS.map((subject) => {
      const subjectQuestions = questions.filter(
        (question) => question.subject === subject
      );
      const subjectCorrect = subjectQuestions.filter(
        (question) => answers[question.id] === question.answer
      ).length;

      return [
        subject,
        {
          correct: subjectCorrect,
          total: subjectQuestions.length,
          percent: subjectQuestions.length
            ? Math.round(
                (subjectCorrect / subjectQuestions.length) * 100
              )
            : 0,
        },
      ];
    })
  ) as Record<Subject, { correct: number; total: number; percent: number }>;

  return {
    correct,
    total,
    percent: total
      ? Math.round((correct / total) * 100)
      : 0,
    wrongIds,
    perSubject,
  };
}
