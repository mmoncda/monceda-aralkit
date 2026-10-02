import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(
  "src/lib/reviewer/study-focus.ts",
  "utf8"
);

const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const encoded = Buffer.from(output).toString("base64");

const { chooseStudyFocus } = await import(
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
  correct: 23,
  total: 40,
  subjectScores: {
    Math: 5,
    Science: 10,
    English: 0,
    Reasoning: 8,
  },
};

assert.equal(chooseStudyFocus([]), null);
console.log("PASS: No recommendation without history");

assert.equal(
  chooseStudyFocus([first]),
  "Science"
);
console.log("PASS: Science selected for 11/40 result");

assert.equal(
  chooseStudyFocus([first, second]),
  "English"
);
console.log("PASS: Focus updates across multiple attempts");

assert.equal(
  chooseStudyFocus([{
    ...first,
    correct: 20,
    subjectScores: {
      Math: 5,
      Science: 5,
      English: 5,
      Reasoning: 5,
    },
  }]),
  "Math"
);
console.log("PASS: Ties resolve consistently");

assert.equal(first.subjectScores.Science, 1);
console.log("PASS: Saved scores are not modified");

console.log("STUDY FOCUS TESTS: 5/5 PASSED");
