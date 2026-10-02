import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import ts from "typescript";

const source = readFileSync(
  "src/lib/grades/calculate.ts",
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

const { calculateAverage } =
  await import(moduleUrl);

const cases = [
  {
    name: "Normal grades",
    rows: [
      { name: "Math", grade: "80" },
      { name: "Science", grade: "90" },
      { name: "English", grade: "100" },
    ],
    average: 90,
    status: "valid",
  },
  {
    name: "Decimal grades",
    rows: [
      { name: "Math", grade: "90.5" },
      { name: "Science", grade: "90" },
    ],
    average: 90.25,
    status: "valid",
  },
  {
    name: "Empty form",
    rows: [
      { name: "", grade: "" },
    ],
    average: null,
    status: "empty",
  },
  {
    name: "Incomplete grade",
    rows: [
      { name: "Math", grade: "" },
    ],
    average: null,
    status: "invalid",
  },
  {
    name: "Missing subject name",
    rows: [
      { name: "", grade: "90" },
    ],
    average: null,
    status: "invalid",
  },
  {
    name: "Grade above 100",
    rows: [
      { name: "Math", grade: "101" },
    ],
    average: null,
    status: "invalid",
  },
  {
    name: "Negative grade",
    rows: [
      { name: "Math", grade: "-1" },
    ],
    average: null,
    status: "invalid",
  },
  {
    name: "Zero grade",
    rows: [
      { name: "Math", grade: "0" },
    ],
    average: 0,
    status: "valid",
  },
  {
    name: "Perfect grade",
    rows: [
      { name: "Math", grade: "100" },
    ],
    average: 100,
    status: "valid",
  },
  {
    name: "Ignore empty row",
    rows: [
      { name: "Math", grade: "90" },
      { name: "", grade: "" },
    ],
    average: 90,
    status: "valid",
  },
  {
    name: "Non-numeric grade",
    rows: [
      { name: "Math", grade: "abc" },
    ],
    average: null,
    status: "invalid",
  },
  {
    name: "All subjects equal weight",
    rows: [
      { name: "Math", grade: "75" },
      { name: "Science", grade: "85" },
      { name: "English", grade: "95" },
    ],
    average: 85,
    status: "valid",
  },
];

let passed = 0;

for (const item of cases) {

  const actual = calculateAverage(
    item.rows
  );

  assert.equal(
    actual.average,
    item.average,
    item.name
  );

  assert.equal(
    actual.status,
    item.status,
    item.name
  );

  passed++;

  console.log(
    "PASS:",
    item.name
  );

}

console.log("");

console.log(
  `GRADE CALCULATOR: ${passed}/${cases.length} TESTS PASSED`
);
