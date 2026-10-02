import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(
  "src/lib/reviewer/exam-trend.ts",
  "utf8"
);

const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const encoded = Buffer.from(compiled).toString("base64");
const { buildExamTrend } = await import(
  `data:text/javascript;base64,${encoded}`
);

const makeEntry = (id, correct) => ({
  id: String(id),
  completedAt: 1000 + id,
  correct,
  total: 40,
  subjectScores: {
    Math: correct / 4,
    Science: correct / 4,
    English: correct / 4,
    Reasoning: correct / 4,
  },
});

assert.deepEqual(buildExamTrend([]), []);
console.log("PASS: Empty history");

const result = buildExamTrend([
  makeEntry(3, 20),
  makeEntry(1, 11),
  makeEntry(2, 16),
]);

assert.deepEqual(
  result.map((point) => point.id),
  ["1", "2", "3"]
);
console.log("PASS: Oldest to newest");

assert.deepEqual(
  result.map((point) => point.percent),
  [28, 40, 50]
);
console.log("PASS: Percentages calculated correctly");

const many = Array.from(
  { length: 15 },
  (_, index) => makeEntry(index + 1, 20)
);

const limited = buildExamTrend(many);

assert.equal(limited.length, 10);
assert.equal(limited[0].id, "6");
assert.equal(limited.at(-1).id, "15");
console.log("PASS: Latest 10 attempts retained");

assert.equal(many[0].id, "1");
assert.equal(many.at(-1).id, "15");
console.log("PASS: Original history unchanged");

assert.deepEqual(
  buildExamTrend([
    makeEntry(1, 0),
    makeEntry(2, 40),
  ]).map((point) => point.percent),
  [0, 100]
);
console.log("PASS: Zero and perfect scores");

console.log("EXAM TREND TESTS: 6/6 PASSED");
