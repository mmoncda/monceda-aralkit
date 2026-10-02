import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(
  "src/lib/reviewer/exam-history.ts",
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
  readExamHistory,
  saveExamHistory,
  EXAM_HISTORY_KEY,
} = await import(
  `data:text/javascript;base64,${encoded}`
);

const memory = new Map();

const storage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
};

const makeEntry = (number) => ({
  id: String(number),
  completedAt: 1000 + number,
  correct: 11,
  total: 40,
  subjectScores: {
    Math: 4,
    Science: 1,
    English: 4,
    Reasoning: 2,
  },
});

assert.deepEqual(readExamHistory(storage), []);
console.log("PASS: Empty history");

saveExamHistory(storage, makeEntry(1));
assert.equal(readExamHistory(storage).length, 1);
console.log("PASS: Completed attempt saved");

saveExamHistory(storage, makeEntry(1));
assert.equal(readExamHistory(storage).length, 1);
console.log("PASS: Refresh does not duplicate an attempt");

for (let number = 2; number <= 25; number++) {
  saveExamHistory(storage, makeEntry(number));
}

const history = readExamHistory(storage);

assert.equal(history.length, 20);
assert.equal(history[0].id, "25");
assert.equal(history.at(-1).id, "6");
console.log("PASS: Latest 20 attempts retained");

assert.deepEqual(
  history[0].subjectScores,
  makeEntry(25).subjectScores
);
console.log("PASS: Subject scores retained");

memory.set(EXAM_HISTORY_KEY, "{broken");
assert.deepEqual(readExamHistory(storage), []);
console.log("PASS: Corrupt history handled safely");

memory.set(
  EXAM_HISTORY_KEY,
  JSON.stringify([
    {
      ...makeEntry(1),
      subjectScores: {
        ...makeEntry(1).subjectScores,
        Science: 99,
      },
    },
    makeEntry(2),
  ])
);

assert.equal(readExamHistory(storage).length, 1);
assert.equal(readExamHistory(storage)[0].id, "2");
console.log("PASS: Invalid records excluded");

console.log("EXAM HISTORY TESTS: 7/7 PASSED");
