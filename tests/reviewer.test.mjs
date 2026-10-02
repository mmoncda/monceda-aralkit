import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import ts from "typescript";

const bank = JSON.parse(readFileSync("src/data/questions/grade7.json", "utf8"));
const originalBank = JSON.parse(
  readFileSync("backups/phase9-20260921-current/src/data/questions/grade7.json", "utf8")
);
const source = readFileSync("src/lib/reviewer/quiz.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled.outputText).toString("base64")}`;
const { buildSession, gradeSession, QUESTION_COUNTS, SUBJECTS } = await import(moduleUrl);

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log("PASS:", name);
}

check("preserves all 40 original questions exactly", () => {
  assert.equal(originalBank.length, 40);
  assert.deepEqual(bank.slice(0, 40), originalBank);
});

check("contains 160 new questions and 200 total", () => {
  assert.equal(bank.length - originalBank.length, 160);
  assert.equal(bank.length, 200);
});

check("contains 50 questions per subject", () => {
  for (const subject of SUBJECTS) {
    assert.equal(bank.filter((q) => q.subject === subject).length, 50);
  }
});

check("has unique IDs and prompts", () => {
  assert.equal(new Set(bank.map((q) => q.id)).size, bank.length);
  assert.equal(new Set(bank.map((q) => q.prompt.trim().toLowerCase())).size, bank.length);
});

check("every question follows the bank schema", () => {
  for (const q of bank) {
    assert.deepEqual(Object.keys(q), ["id", "subject", "prompt", "options", "answer", "explanation"]);
    assert.ok(SUBJECTS.includes(q.subject));
    assert.ok(q.prompt.trim().length > 0);
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options.map((option) => option.trim().toLowerCase())).size, 4);
    assert.ok(q.options.every((option) => option.trim().length > 0));
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3);
    assert.ok(q.explanation.trim().length > 0);
  }
});

for (const subject of ["Mixed", ...SUBJECTS]) {
  for (const count of QUESTION_COUNTS) {
    check(`${subject} ${count}-question session`, () => {
      const session = buildSession(bank, count, subject, () => 0.42);
      assert.equal(session.length, count);
      assert.equal(new Set(session.map((q) => q.id)).size, count);
      if (subject !== "Mixed") {
        assert.ok(session.every((q) => q.subject === subject));
      } else {
        const totals = SUBJECTS.map(
          (item) => session.filter((q) => q.subject === item).length
        );
        assert.ok(Math.max(...totals) - Math.min(...totals) <= 1);
        assert.equal(totals.reduce((sum, value) => sum + value, 0), count);
      }
    });
  }
}

check("defaults to the original 15-question mixed behavior", () => {
  const session = buildSession(bank, undefined, undefined, () => 0.42);
  assert.equal(session.length, 15);
  assert.deepEqual(
    SUBJECTS.map((subject) => session.filter((q) => q.subject === subject).length),
    [4, 4, 4, 3]
  );
});

check("answer key grades every bank answer as correct", () => {
  const answers = Object.fromEntries(bank.map((q) => [q.id, q.answer]));
  const result = gradeSession(bank, answers);
  assert.equal(result.correct, 200);
  assert.equal(result.percent, 100);
  assert.deepEqual(result.wrongIds, []);
  for (const subject of SUBJECTS) {
    assert.deepEqual(result.perSubject[subject], { correct: 50, total: 50, percent: 100 });
  }
});

check("wrong and unanswered responses score as incorrect", () => {
  const session = buildSession(bank, 40, "Mixed", () => 0.42);
  const answers = Object.fromEntries(
    session.slice(0, 20).map((q) => [q.id, (q.answer + 1) % 4])
  );
  const result = gradeSession(session, answers);
  assert.equal(result.correct, 0);
  assert.equal(result.percent, 0);
  assert.equal(result.wrongIds.length, 40);
});

check("partial scoring and subject breakdown are accurate", () => {
  const session = SUBJECTS.flatMap((subject) =>
    bank.filter((q) => q.subject === subject).slice(0, 2)
  );
  const answers = Object.fromEntries(
    session.filter((_, index) => index % 2 === 0).map((q) => [q.id, q.answer])
  );
  const result = gradeSession(session, answers);
  assert.equal(result.correct, 4);
  assert.equal(result.total, 8);
  assert.equal(result.percent, 50);
  for (const subject of SUBJECTS) {
    assert.deepEqual(result.perSubject[subject], { correct: 1, total: 2, percent: 50 });
  }
});

check("retry subset scoring remains accurate", () => {
  const subset = bank.slice(0, 3);
  const answers = Object.fromEntries(subset.map((q) => [q.id, q.answer]));
  const result = gradeSession(subset, answers);
  assert.equal(result.total, 3);
  assert.equal(result.correct, 3);
  assert.equal(result.wrongIds.length, 0);
});

check("invalid counts and insufficient banks are rejected", () => {
  assert.throws(() => buildSession(bank, 12), /Unsupported question count/);
  assert.throws(() => buildSession([], 10, "Science"), /Insufficient questions/);
  assert.throws(() => buildSession([], 10, "Mixed"), /Insufficient questions/);
});

console.log("");
console.log(`REVIEWER TESTS: ${passed}/${passed} PASSED`);
