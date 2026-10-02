import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import ts from "typescript";

const source = readFileSync(
  "src/lib/cover/cover.ts",
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

const {
  COVER_TEMPLATES,
  normalizeCover,
  formatCoverDate,
} = await import(
  `data:text/javascript;base64,${encoded}`
);

let passed = 0;

function check(name, callback) {
  callback();
  passed++;
  console.log("PASS:", name);
}

const blank = {
  title: "",
  student: "",
  gradeSection: "",
  subject: "",
  teacher: "",
  school: "",
  date: "",
};

check("Three cover templates", () => {
  assert.equal(
    COVER_TEMPLATES.length,
    3
  );
});

check("Unique template IDs", () => {
  assert.equal(
    new Set(
      COVER_TEMPLATES.map(
        item => item.id
      )
    ).size,
    3
  );
});

check("Classic template", () => {
  assert.ok(
    COVER_TEMPLATES.some(
      item => item.id === "classic"
    )
  );
});

check("Modern template", () => {
  assert.ok(
    COVER_TEMPLATES.some(
      item => item.id === "modern"
    )
  );
});

check("Minimal template", () => {
  assert.ok(
    COVER_TEMPLATES.some(
      item => item.id === "minimal"
    )
  );
});

check("Default project title", () => {
  assert.equal(
    normalizeCover(blank).title,
    "School Project"
  );
});

check("Default student label", () => {
  assert.equal(
    normalizeCover(blank).student,
    "Student Name"
  );
});

check("Whitespace trimming", () => {
  assert.equal(
    normalizeCover({
      ...blank,
      student: "  Juan Cruz  ",
    }).student,
    "Juan Cruz"
  );
});

check("Subject preserved", () => {
  assert.equal(
    normalizeCover({
      ...blank,
      subject: "Science",
    }).subject,
    "Science"
  );
});

check("Optional teacher", () => {
  assert.equal(
    normalizeCover(blank).teacher,
    ""
  );
});

check("Valid date formatting", () => {
  assert.equal(
    formatCoverDate("2026-09-21"),
    "September 21, 2026"
  );
});

check("Leap day formatting", () => {
  assert.equal(
    formatCoverDate("2024-02-29"),
    "February 29, 2024"
  );
});

check("Invalid calendar date", () => {
  assert.equal(
    formatCoverDate("2026-02-30"),
    ""
  );
});

check("Invalid date text", () => {
  assert.equal(
    formatCoverDate("not-a-date"),
    ""
  );
});

check("Blank date", () => {
  assert.equal(
    formatCoverDate(""),
    ""
  );
});

check("Input remains unchanged", () => {
  const input = {
    ...blank,
    title: "  My Project  ",
  };

  normalizeCover(input);

  assert.equal(
    input.title,
    "  My Project  "
  );
});

console.log("");

console.log(
  `COVER MAKER TESTS: ${passed}/16 PASSED`
);
