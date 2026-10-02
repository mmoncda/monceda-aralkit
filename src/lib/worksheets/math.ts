export type Operation =
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division";

export type Difficulty =
  | "easy"
  | "medium"
  | "hard";

export type Problem = {
  id: number;
  left: number;
  right: number;
  operator: string;
  answer: number;
};

export type Settings = {
  operation: Operation;
  difficulty: Difficulty;
  count: number;
};

const ranges = {
  easy: [1, 10],
  medium: [10, 99],
  hard: [100, 999],
} as const;

export function generateWorksheet(
  settings: Settings,
  random: () => number = Math.random
): Problem[] {

  const { operation, difficulty, count } = settings;

  if (![10, 15, 20].includes(count)) {
    throw new Error("Invalid question count");
  }

  if (!Object.hasOwn(ranges, difficulty)) {
    throw new Error("Invalid difficulty");
  }

  if (![
    "addition",
    "subtraction",
    "multiplication",
    "division",
  ].includes(operation)) {
    throw new Error("Invalid operation");
  }

  function integer(min: number, max: number) {
    return min + Math.floor(
      random() * (max - min + 1)
    );
  }

  const problems: Problem[] = [];
  const used = new Set<string>();

  let attempts = 0;

  while (problems.length < count && attempts < 10000) {
    attempts++;

    let left = 0;
    let right = 0;
    let answer = 0;
    let operator = "";

    if (
      operation === "addition" ||
      operation === "subtraction"
    ) {
      const [min, max] = ranges[difficulty];

      const a = integer(min, max);
      const b = integer(min, max);

      if (operation === "addition") {
        left = a;
        right = b;
        answer = a + b;
        operator = "+";
      } else {
        left = Math.max(a, b);
        right = Math.min(a, b);
        answer = left - right;
        operator = "−";
      }
    }

    if (operation === "multiplication") {
      const [min, max] =
        difficulty === "easy" ? [1, 10] :
        difficulty === "medium" ? [2, 12] :
        [10, 99];

      left = integer(min, max);
      right = integer(min, max);
      answer = left * right;
      operator = "×";
    }

    if (operation === "division") {
      const [min, max] =
        difficulty === "easy" ? [1, 10] :
        difficulty === "medium" ? [2, 12] :
        [10, 99];

      right = integer(
        difficulty === "hard" ? 3 : min,
        difficulty === "hard" ? 25 : max
      );

      answer = integer(min, max);
      left = right * answer;
      operator = "÷";
    }

    const key =
      operation === "addition" ||
      operation === "multiplication"
        ? [Math.min(left, right), operator,
           Math.max(left, right)].join(":")
        : [left, operator, right].join(":");

    if (used.has(key)) continue;

    used.add(key);

    problems.push({
      id: problems.length + 1,
      left,
      right,
      operator,
      answer,
    });
  }

  if (problems.length !== count) {
    throw new Error(
      "Unable to generate enough unique problems"
    );
  }

  return problems;
}
