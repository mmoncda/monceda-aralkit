import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const bank = JSON.parse(
  readFileSync("src/data/questions/grade7.json", "utf8")
);
const source = readFileSync(
  "src/lib/reviewer/mock-exam-state.ts", "utf8"
);
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const encoded = Buffer.from(output).toString("base64");
const { parseSavedMockExam } = await import(
  `data:text/javascript;base64,${encoded}`
);

const now = Date.now();
const questions = ["Math", "Science", "English", "Reasoning"]
  .flatMap((subject) =>
    bank.filter((q) => q.subject === subject).slice(0, 10)
  );

const saved = {
  version: 1,
  phase: "exam",
  questionIds: questions.map((q) => q.id),
  answers: { [questions[0].id]: questions[0].answer },
  current: 7,
  deadline: now + 30 * 60 * 1000,
};

const restored = parseSavedMockExam(
  JSON.stringify(saved), bank, now
);

assert.ok(restored);
assert.equal(restored.questions.length, 40);
assert.equal(restored.current, 7);
assert.equal(restored.deadline, saved.deadline);
assert.equal(
  restored.answers[questions[0].id],
  questions[0].answer
);
console.log("PASS: Order, answers and deadline restored");

assert.equal(parseSavedMockExam("{broken", bank, now), null);
console.log("PASS: Invalid JSON rejected");

assert.equal(
  parseSavedMockExam(
    JSON.stringify({
      ...saved,
      questionIds: [
        ...saved.questionIds.slice(0, 39),
        saved.questionIds[0],
      ],
    }),
    bank, now
  ),
  null
);
console.log("PASS: Duplicate questions rejected");

assert.equal(
  parseSavedMockExam(
    JSON.stringify({
      ...saved,
      answers: { [questions[0].id]: 99 },
    }),
    bank, now
  ),
  null
);
console.log("PASS: Invalid answer rejected");

assert.equal(
  parseSavedMockExam(
    JSON.stringify({
      ...saved,
      deadline: now + 90 * 60 * 1000,
    }),
    bank, now
  ),
  null
);
console.log("PASS: Extended deadline rejected");

const expired = parseSavedMockExam(
  JSON.stringify({
    ...saved,
    deadline: now - 1000,
  }),
  bank, now
);
assert.ok(expired);
assert.ok(expired.deadline < now);
console.log("PASS: Expired exam restores for submission");

console.log("MOCK EXAM RESUME: 6/6 PASSED");
