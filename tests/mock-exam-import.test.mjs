import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(
  "src/lib/reviewer/exam-history-import.ts",
  "utf8"
);

const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const encoded = Buffer.from(output).toString("base64");

const {
  parseExamHistoryCsv,
  mergeExamHistory,
} = await import(
  `data:text/javascript;base64,${encoded}`
);

const header =
  "Completed at (ISO),Correct,Total,Percent," +
  "Mathematics,Science,English,Reasoning";

const row =
  "2026-09-21T04:41:04.000Z,11,40,28,4,1,4,2";

const csv = "\uFEFF" + header + "\r\n" + row + "\r\n";

const imported = parseExamHistoryCsv(csv);

assert.equal(imported.length, 1);
assert.equal(imported[0].correct, 11);
assert.equal(imported[0].subjectScores.Science, 1);
console.log("PASS: AralKit CSV imported with correct scores");

assert.throws(
  () => parseExamHistoryCsv("Other CSV\n" + row),
  /AralKit/
);
console.log("PASS: Unrelated CSV rejected");

assert.throws(
  () => parseExamHistoryCsv(
    header + "\n" +
    "2026-09-21T04:41:04.000Z,11,40,28,4,9,4,2"
  ),
  /scores/
);
console.log("PASS: Inconsistent subject scores rejected");

assert.throws(
  () => parseExamHistoryCsv(
    header + "\n" + row + "\n" + row
  ),
  /duplicate/
);
console.log("PASS: Duplicate CSV rows rejected");

const existing = [{
  ...imported[0],
  id: "123456789-original",
}];

const merged = mergeExamHistory(existing, imported);

assert.equal(merged.length, 1);
assert.equal(merged[0].id, "123456789-original");
console.log("PASS: Existing matching attempt preserved");

assert.equal(
  mergeExamHistory(merged, imported).length,
  1
);
console.log("PASS: Re-import does not duplicate attempts");

const many = Array.from({ length: 25 }, (_, index) => ({
  ...imported[0],
  id: String(index),
  completedAt: imported[0].completedAt + index,
}));

const limited = mergeExamHistory(many, []);

assert.equal(limited.length, 20);
assert.equal(
  limited[0].completedAt,
  imported[0].completedAt + 24
);
console.log("PASS: Latest 20 attempts retained");

assert.equal(existing.length, 1);
assert.equal(existing[0].id, "123456789-original");
console.log("PASS: Existing input not modified");

console.log("MOCK EXAM IMPORT TESTS: 8/8 PASSED");
