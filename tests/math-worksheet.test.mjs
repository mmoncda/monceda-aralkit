import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(
  "src/lib/worksheets/math.ts",
  "utf8"
);

const compiled = ts.transpileModule(
  source,
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }
);

const encoded = Buffer.from(
  compiled.outputText
).toString("base64");

const { generateWorksheet } = await import(
  `data:text/javascript;base64,${encoded}`
);

function seededRandom(seed) {
  let value = seed >>> 0;

  return () => {
    value = (
      1664525 * value + 1013904223
    ) >>> 0;

    return value / 4294967296;
  };
}

let passed = 0;

function check(name, callback) {
  callback();
  passed++;
  console.log("PASS:", name);
}

const operations = [
  "addition",
  "subtraction",
  "multiplication",
  "division",
];

const difficulties = [
  "easy",
  "medium",
  "hard",
];

const counts = [10, 15, 20];

for (const operation of operations) {
  for (const difficulty of difficulties) {
    for (const count of counts) {

      check(
        `${operation} / ${difficulty} / ${count}`,
        () => {
          const problems = generateWorksheet(
            {
              operation,
              difficulty,
              count,
            },
            seededRandom(12345)
          );

          assert.equal(
            problems.length,
            count
          );

          const keys = new Set();

          for (const p of problems) {
            assert.ok(
              Number.isInteger(p.left)
            );

            assert.ok(
              Number.isInteger(p.right)
            );

            assert.ok(
              Number.isInteger(p.answer)
            );

            const key = [
              operation === "addition" ||
              operation === "multiplication"
                ? Math.min(p.left, p.right)
                : p.left,
              p.operator,
              operation === "addition" ||
              operation === "multiplication"
                ? Math.max(p.left, p.right)
                : p.right,
            ].join(":");

            assert.ok(!keys.has(key));
            keys.add(key);

            if (operation === "addition") {
              assert.equal(
                p.answer,
                p.left + p.right
              );
            }

            if (operation === "subtraction") {
              assert.equal(
                p.answer,
                p.left - p.right
              );

              assert.ok(p.answer >= 0);
            }

            if (operation === "multiplication") {
              assert.equal(
                p.answer,
                p.left * p.right
              );
            }

            if (operation === "division") {
              assert.notEqual(p.right, 0);

              assert.equal(
                p.answer,
                p.left / p.right
              );
            }
          }
        }
      );
    }
  }
}

check("Repeatable seeded results", () => {
  const settings = {
    operation: "addition",
    difficulty: "medium",
    count: 15,
  };

  assert.deepEqual(
    generateWorksheet(
      settings,
      seededRandom(42)
    ),
    generateWorksheet(
      settings,
      seededRandom(42)
    )
  );
});

check("Invalid count rejected", () => {
  assert.throws(
    () => generateWorksheet({
      operation: "addition",
      difficulty: "easy",
      count: 21,
    }),
    /Invalid question count/
  );
});

check("Invalid operation rejected", () => {
  assert.throws(
    () => generateWorksheet({
      operation: "unknown",
      difficulty: "easy",
      count: 10,
    }),
    /Invalid operation/
  );
});

check("Invalid difficulty rejected", () => {
  assert.throws(
    () => generateWorksheet({
      operation: "addition",
      difficulty: "unknown",
      count: 10,
    }),
    /Invalid difficulty/
  );
});

console.log("");
console.log(
  `WORKSHEET TESTS: ${passed}/40 PASSED`
);
