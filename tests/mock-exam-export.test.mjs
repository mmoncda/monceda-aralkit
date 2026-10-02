import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(
  "src/lib/reviewer/exam-history-export.ts",
  "utf8"
);

const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const encoded = Buffer.from(output).toString("base64");

const { createExamHistoryCsv } = await import(
  `data:text/javascript;base64,${encoded}`
);

const makeEntry = (id, date, correct, scores) => ({
  id: String(id),
  completedAt: Date.parse(date),
  correct,
  total: 40,
  subjectScores: scores,
});

const older = makeEntry(
  1,
  "2026-09-20T08:00:00.000Z",
  11,
  {
    Math: 4,
    Science: 1,
    English: 4,
    Reasoning: 2,
  }
);

const newer = makeEntry(
  2,
  "2026-09-21T08:00:00.000Z",
  20,
  {
    Math: 5,
    Science: 5,
    English: 5,
    Reasoning: 5,
  }
);

const empty = createExamHistoryCsv([]);

assert.ok(empty.startsWith("Completed at (ISO),"));
assert.equal(empty.trim().split("\r\n").length, 1);
console.log("PASS: Empty history produces CSV header");

const input = [older, newer];
const csv = createExamHistoryCsv(input);
const lines = csv.trim().split("\r\n");

assert.equal(lines.length, 3);
console.log("PASS: Both attempts exported");

assert.ok(lines[1].startsWith("2026-09-21T"));
assert.ok(lines[2].startsWith("2026-09-20T"));
console.log("PASS: Newest attempt first");

assert.equal(
  lines[2],
  "2026-09-20T08:00:00.000Z,11,40,28,4,1,4,2"
);
console.log("PASS: Overall and subject scores correct");

assert.deepEqual(input, [older, newer]);
console.log("PASS: Saved history not modified");

console.log("MOCK EXAM EXPORT TESTS: 5/5 PASSED");
