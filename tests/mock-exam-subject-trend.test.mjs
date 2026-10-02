import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(
  "src/lib/reviewer/subject-trend.ts",
  "utf8"
);

const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const encoded = Buffer.from(output).toString("base64");
const { buildSubjectTrend } = await import(
  `data:text/javascript;base64,${encoded}`
);

const first = {
  id: "1",
  completedAt: 1000,
  correct: 11,
  total: 40,
  subjectScores: {
    Math: 4,
    Science: 1,
    English: 4,
    Reasoning: 2,
  },
};

const second = {
  id: "2",
  completedAt: 2000,
  correct: 20,
  total: 40,
  subjectScores: {
    Math: 5,
    Science: 5,
    English: 5,
    Reasoning: 5,
  },
};

assert.deepEqual(buildSubjectTrend([], "All"), []);
console.log("PASS: Empty history");

assert.deepEqual(
  buildSubjectTrend([second, first], "All")
    .map((item) => item.percent),
  [28, 50]
);
console.log("PASS: Overall scores remain out of 40");

assert.deepEqual(
  buildSubjectTrend([second, first], "Science")
    .map((item) => item.percent),
  [10, 50]
);
console.log("PASS: Science scores use a 10-question scale");

assert.deepEqual(
  buildSubjectTrend([second, first], "Reasoning")
    .map((item) => item.correct),
  [2, 5]
);
console.log("PASS: Reasoning scores are correct");

const science = buildSubjectTrend([first], "Science");
assert.equal(science[0].total, 10);
assert.equal(science[0].correct, 1);
console.log("PASS: Subject score label is out of 10");

const many = Array.from({ length: 15 }, (_, index) => ({
  ...second,
  id: String(index + 1),
  completedAt: index + 1,
}));

const trend = buildSubjectTrend(many, "English");
assert.equal(trend.length, 10);
assert.equal(trend[0].id, "6");
assert.equal(trend.at(-1).id, "15");
console.log("PASS: Latest 10 attempts, oldest to newest");

assert.equal(many[0].id, "1");
assert.equal(first.subjectScores.Science, 1);
console.log("PASS: Stored history remains unchanged");

console.log("SUBJECT TREND TESTS: 7/7 PASSED");
