import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const bank = JSON.parse(
  readFileSync("src/data/questions/grade7.json", "utf8")
);
const source = readFileSync("src/lib/reviewer/quiz.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
});
const encoded = Buffer.from(compiled.outputText).toString("base64");
const { buildSession, gradeSession, SUBJECTS } = await import(
  `data:text/javascript;base64,${encoded}`
);

assert.equal(bank.length, 200);
console.log("PASS: Uses existing 200-question bank");

const exam = buildSession(bank, 40, "Mixed", () => 0.42);
assert.equal(exam.length, 40);
assert.equal(new Set(exam.map((q) => q.id)).size, 40);
console.log("PASS: 40 distinct exam questions");

for (const subject of SUBJECTS) {
  assert.equal(exam.filter((q) => q.subject === subject).length, 10);
}
console.log("PASS: 10 questions per subject");

const answers = Object.fromEntries(
  exam.map((q) => [q.id, q.answer])
);
const result = gradeSession(exam, answers);
assert.equal(result.correct, 40);
assert.equal(result.percent, 100);
for (const subject of SUBJECTS) {
  assert.equal(result.perSubject[subject].correct, 10);
}
console.log("PASS: Overall and per-subject grading");

const route = readFileSync(
  "src/app/mock-exam/mock-exam.tsx",
  "utf8"
);
assert.match(route, /EXAM_SECONDS = 60 \* 60/);
assert.match(route, /setPhase\("result"\)/);
console.log("PASS: Timed exam and result controls");

console.log("MOCK EXAM TESTS: 5/5 PASSED");
