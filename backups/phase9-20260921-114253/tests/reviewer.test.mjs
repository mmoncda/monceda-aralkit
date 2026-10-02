import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import ts from "typescript";

const bank = JSON.parse(
  readFileSync(
    "src/data/questions/grade7.json",
    "utf8"
  )
);

const source = readFileSync(
  "src/lib/reviewer/quiz.ts",
  "utf8"
);

const compiled = ts.transpileModule(
  source,
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }
);

const encoded = Buffer.from(
  compiled.outputText
).toString("base64");

const moduleUrl =
  `data:text/javascript;base64,${encoded}`;

const {
  buildSession,
  gradeSession,
} = await import(moduleUrl);

let passed = 0;

function check(name, fn) {
  fn();
  passed++;
  console.log("PASS:", name);
}

check("40 original questions", () => {
  assert.equal(bank.length, 40);
});

check("Unique question IDs", () => {
  assert.equal(
    new Set(bank.map(q => q.id)).size,
    40
  );
});

check("Four valid options", () => {
  for (const q of bank) {
    assert.equal(q.options.length, 4);
    assert.equal(
      new Set(q.options).size,
      4
    );
  }
});

check("Valid answer indices", () => {
  for (const q of bank) {
    assert.ok(
      Number.isInteger(q.answer)
    );
    assert.ok(
      q.answer >= 0 &&
      q.answer <= 3
    );
  }
});

check("Explanations included", () => {
  for (const q of bank) {
    assert.ok(
      q.explanation.trim().length > 0
    );
  }
});

check("15-question session", () => {
  assert.equal(
    buildSession(bank).length,
    15
  );
});

check("Balanced subjects", () => {
  const session = buildSession(bank);

  for (const [subject, count] of [
    ["Math", 4],
    ["Science", 4],
    ["English", 4],
    ["Reasoning", 3],
  ]) {
    assert.equal(
      session.filter(
        q => q.subject === subject
      ).length,
      count
    );
  }
});

check("No duplicate session questions", () => {
  const session = buildSession(bank);

  assert.equal(
    new Set(
      session.map(q => q.id)
    ).size,
    15
  );
});

const session = buildSession(bank);

check("All correct gives 100%", () => {
  const answers = Object.fromEntries(
    session.map(
      q => [q.id, q.answer]
    )
  );

  const result = gradeSession(
    session,
    answers
  );

  assert.equal(result.correct, 15);
  assert.equal(result.percent, 100);
  assert.equal(
    result.wrongIds.length,
    0
  );
});

check("Unanswered gives zero", () => {
  const result = gradeSession(
    session,
    {}
  );

  assert.equal(result.correct, 0);
  assert.equal(result.percent, 0);
  assert.equal(
    result.wrongIds.length,
    15
  );
});

check("Incorrect answers detected", () => {
  const answers = Object.fromEntries(
    session.map(
      q => [
        q.id,
        (q.answer + 1) % 4,
      ]
    )
  );

  const result = gradeSession(
    session,
    answers
  );

  assert.equal(result.correct, 0);
  assert.equal(
    result.wrongIds.length,
    15
  );
});

check("Partial scoring", () => {
  const answers = Object.fromEntries(
    session.slice(0, 9).map(
      q => [q.id, q.answer]
    )
  );

  const result = gradeSession(
    session,
    answers
  );

  assert.equal(result.correct, 9);
  assert.equal(result.percent, 60);
  assert.equal(
    result.wrongIds.length,
    6
  );
});

check("Retry subset scoring", () => {
  const subset = session.slice(0, 3);

  const answers = Object.fromEntries(
    subset.map(
      q => [q.id, q.answer]
    )
  );

  const result = gradeSession(
    subset,
    answers
  );

  assert.equal(result.total, 3);
  assert.equal(result.correct, 3);
});

check("Insufficient bank rejected", () => {
  assert.throws(
    () => buildSession([]),
    /Insufficient questions/
  );
});

check("Bank subject counts", () => {
  for (const subject of [
    "Math",
    "Science",
    "English",
    "Reasoning",
  ]) {
    assert.equal(
      bank.filter(
        q => q.subject === subject
      ).length,
      10
    );
  }
});

console.log("");
console.log(
  `REVIEWER TESTS: ${passed}/15 PASSED`
);
