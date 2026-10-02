import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const bank = JSON.parse(
  readFileSync("src/data/questions/grade7.json", "utf8")
);

const source = readFileSync(
  "src/lib/reviewer/review-filter.ts", "utf8"
);

const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const encoded = Buffer.from(compiled).toString("base64");
const { filterMockExamReview } = await import(
  `data:text/javascript;base64,${encoded}`
);

const questions = [
  "Math", "Science", "English", "Reasoning"
].flatMap((subject) =>
  bank.filter((q) => q.subject === subject).slice(0, 2)
);

const answers = Object.fromEntries(
  questions.map((q) => [q.id, q.answer])
);

answers[questions[0].id] =
  (questions[0].answer + 1) %
  questions[0].options.length;

delete answers[questions[2].id];

assert.equal(
  filterMockExamReview(
    questions, answers, "all", "All"
  ).length,
  8
);
console.log("PASS: All questions shown");

const incorrect = filterMockExamReview(
  questions, answers, "incorrect", "All"
);

assert.equal(incorrect.length, 2);
console.log("PASS: Incorrect and unanswered included");

assert.equal(incorrect[0].index, 0);
assert.equal(incorrect[1].index, 2);
console.log("PASS: Original question numbers preserved");

assert.equal(
  filterMockExamReview(
    questions, answers, "incorrect", "Science"
  ).length,
  1
);
console.log("PASS: Science mistakes isolated");

assert.equal(
  filterMockExamReview(
    questions, answers, "all", "Science"
  ).length,
  2
);
console.log("PASS: All Science answers available");

assert.equal(
  filterMockExamReview(
    questions, answers, "incorrect", "Reasoning"
  ).length,
  0
);
console.log("PASS: Empty result handled");

console.log("MOCK EXAM REVIEW TESTS: 6/6 PASSED");
