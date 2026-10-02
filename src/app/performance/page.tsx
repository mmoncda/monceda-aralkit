"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import styles from "./performance.module.css";

type SubjectKey =
  | "filipino"
  | "english"
  | "math"
  | "science"
  | "ap"
  | "mapeh"
  | "esp";

type Student = {
  id: string;
  name: string;
  grade: string;
  section: string;
  scores: Record<SubjectKey, number>;
  createdAt: string;
};

const SUBJECTS: { key: SubjectKey; label: string }[] = [
  { key: "filipino", label: "Filipino" },
  { key: "english", label: "English" },
  { key: "math", label: "Mathematics" },
  { key: "science", label: "Science" },
  { key: "ap", label: "Araling Panlipunan" },
  { key: "mapeh", label: "MAPEH" },
  { key: "esp", label: "GMRC / EsP" },
];

const STORAGE_KEY = "aralkit-performance-v1";

function average(student: Student) {
  const values = SUBJECTS.map(({ key }) => Number(student.scores[key]) || 0);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function emptyScores(): Record<SubjectKey, number> {
  return {
    filipino: 0,
    english: 0,
    math: 0,
    science: 0,
    ap: 0,
    mapeh: 0,
    esp: 0,
  };
}

export default function PerformancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("Grade 6");
  const [section, setSection] = useState("");
  const [scores, setScores] =
    useState<Record<SubjectKey, number>>(emptyScores());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);

        if (stored) {
          const parsed = JSON.parse(stored);

          if (Array.isArray(parsed)) {
            setStudents(parsed);
          }
        }
      } catch {
        // Ignore malformed local data.
      } finally {
        setReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }, [students, ready]);

  const ranked = useMemo(
    () =>
      [...students]
        .sort((a, b) => average(b) - average(a))
        .map((student, index) => ({
          ...student,
          rank: index + 1,
          average: average(student),
        })),
    [students],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ranked;

    return ranked.filter((student) =>
      `${student.name} ${student.grade} ${student.section}`
        .toLowerCase()
        .includes(q),
    );
  }, [ranked, search]);

  const classAverage = useMemo(() => {
    if (!students.length) return 0;
    return (
      students.reduce((sum, student) => sum + average(student), 0) /
      students.length
    );
  }, [students]);

  const highestAverage = ranked[0]?.average ?? 0;

  function submitStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) return;

    const student: Student = {
      id: crypto.randomUUID(),
      name: name.trim(),
      grade,
      section: section.trim(),
      scores,
      createdAt: new Date().toISOString(),
    };

    setStudents((current) => [...current, student]);
    setName("");
    setSection("");
    setScores(emptyScores());
  }

  function removeStudent(id: string) {
    setStudents((current) => current.filter((student) => student.id !== id));
  }

  function clearAll() {
    if (!students.length) return;

    const confirmed = window.confirm(
      "Delete all student performance records on this device?",
    );

    if (confirmed) setStudents([]);
  }

  function downloadCsvTemplate() {
    const header = [
      "Student",
      "Grade",
      "Section",
      ...SUBJECTS.map((subject) => subject.label),
    ];

    const example = [
      "Juan Dela Cruz",
      "Grade 6",
      "Jacinto",
      90,
      91,
      95,
      92,
      88,
      93,
      94,
    ];

    const csv = [header, example]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "aralkit-student-performance-template.csv";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  function parseCsvLine(line: string) {
    const result: string[] = [];
    let current = "";
    let quoted = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];

      if (char === '"') {
        if (quoted && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === "," && !quoted) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const content = String(reader.result ?? "")
          .replace(/^\uFEFF/, "")
          .trim();

        if (!content) {
          window.alert("The CSV file is empty.");
          return;
        }

        const lines = content
          .split(/\r?\n/)
          .filter((line) => line.trim());

        const expectedHeader = [
          "Student",
          "Grade",
          "Section",
          ...SUBJECTS.map((subject) => subject.label),
        ];

        const header = parseCsvLine(lines[0]);

        const validHeader =
          header.length === expectedHeader.length &&
          expectedHeader.every(
            (column, index) =>
              header[index]?.trim().toLowerCase() ===
              column.toLowerCase(),
          );

        if (!validHeader) {
          window.alert(
            "Invalid CSV format. Please download and use the AralKit CSV template.",
          );
          return;
        }

        const imported: Student[] = [];

        for (let index = 1; index < lines.length; index += 1) {
          const row = parseCsvLine(lines[index]);

          if (row.length !== expectedHeader.length) continue;

          const studentName = row[0]?.trim();
          if (!studentName) continue;

          const values = row.slice(3).map(Number);

          const invalidGrade = values.some(
            (value) =>
              !Number.isFinite(value) ||
              value < 0 ||
              value > 100,
          );

          if (invalidGrade) continue;

          imported.push({
            id: crypto.randomUUID(),
            name: studentName,
            grade: row[1]?.trim() || "Grade 6",
            section: row[2]?.trim() || "",
            scores: {
              filipino: values[0],
              english: values[1],
              math: values[2],
              science: values[3],
              ap: values[4],
              mapeh: values[5],
              esp: values[6],
            },
            createdAt: new Date().toISOString(),
          });
        }

        if (!imported.length) {
          window.alert(
            "No valid student rows were found in the CSV file.",
          );
          return;
        }

        setStudents((current) => [...current, ...imported]);

        window.alert(
          `${imported.length} student record${
            imported.length === 1 ? "" : "s"
          } imported successfully.`,
        );
      } catch {
        window.alert(
          "The CSV could not be read. Please download and use the AralKit CSV template.",
        );
      } finally {
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  }

  function exportCsv() {
    if (!ranked.length) return;

    const header = [
      "Rank",
      "Student",
      "Grade",
      "Section",
      ...SUBJECTS.map((subject) => subject.label),
      "General Average",
    ];

    const rows = ranked.map((student) => [
      student.rank,
      student.name,
      student.grade,
      student.section,
      ...SUBJECTS.map(({ key }) => student.scores[key]),
      student.average.toFixed(2),
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "aralkit-student-performance.csv";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>AralKit Student Tools</span>
          <h1>Student Performance Tracker</h1>
          <p>
            Record subject grades, calculate general averages automatically,
            and rank students from highest to lowest.
          </p>
        </div>
      </section>

      <section className={styles.stats}>
        <article>
          <span>Total Students</span>
          <strong>{students.length}</strong>
        </article>

        <article>
          <span>Class Average</span>
          <strong>{classAverage ? classAverage.toFixed(2) : "—"}</strong>
        </article>

        <article>
          <span>Highest Average</span>
          <strong>{highestAverage ? highestAverage.toFixed(2) : "—"}</strong>
        </article>
      </section>

      <section className={styles.csvPanel}>
        <div>
          <span className={styles.miniLabel}>Bulk Import</span>
          <h2>Import Student Grades</h2>
          <p>
            Download the official AralKit CSV format, fill in the student
            grades, then upload the completed file.
          </p>
        </div>

        <div className={styles.csvActions}>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={downloadCsvTemplate}
          >
            Download CSV Template
          </button>

          <label className={styles.importButton}>
            Import CSV
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={importCsv}
              hidden
            />
          </label>

          <button
            className={styles.secondaryButton}
            type="button"
            onClick={exportCsv}
            disabled={!students.length}
          >
            Export CSV
          </button>
        </div>
      </section>

      <section className={styles.layout}>
        <form className={styles.formCard} onSubmit={submitStudent}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.miniLabel}>New Record</span>
              <h2>Add Student</h2>
            </div>
          </div>

          <label>
            Student Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Juan Dela Cruz"
              required
            />
          </label>

          <div className={styles.twoColumns}>
            <label>
              Grade Level
              <select
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
              >
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index + 1}>Grade {index + 1}</option>
                ))}
              </select>
            </label>

            <label>
              Section
              <input
                value={section}
                onChange={(event) => setSection(event.target.value)}
                placeholder="e.g. Jacinto"
              />
            </label>
          </div>

          <div className={styles.subjectGrid}>
            {SUBJECTS.map(({ key, label }) => (
              <label key={key}>
                {label}
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={scores[key] || ""}
                  onChange={(event) =>
                    setScores((current) => ({
                      ...current,
                      [key]: Math.min(
                        100,
                        Math.max(0, Number(event.target.value)),
                      ),
                    }))
                  }
                  placeholder="0–100"
                  required
                />
              </label>
            ))}
          </div>

          <button className={styles.primaryButton} type="submit">
            Add Student Record
          </button>
        </form>

        <section className={styles.rankingCard}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.miniLabel}>Live Ranking</span>
              <h2>Top Performers</h2>
            </div>

          </div>

          <div className={styles.podium}>
            {[0, 1, 2].map((position) => {
              const student = ranked[position];

              return (
                <article key={position}>
                  <span className={styles.rankBadge}>#{position + 1}</span>
                  <strong>{student?.name ?? "—"}</strong>
                  <small>
                    {student
                      ? `${student.average.toFixed(2)} average`
                      : "No student yet"}
                  </small>
                </article>
              );
            })}
          </div>
        </section>
      </section>

      <section className={styles.tableCard}>
        <div className={styles.tableToolbar}>
          <div>
            <span className={styles.miniLabel}>All Records</span>
            <h2>Student Ranking</h2>
          </div>

          <div className={styles.toolbarActions}>
            <input
              className={styles.search}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student, grade, section…"
            />

            <button
              className={styles.dangerButton}
              type="button"
              onClick={clearAll}
              disabled={!students.length}
            >
              Clear All
            </button>
          </div>
        </div>

        {!ready ? (
          <div className={styles.emptyState}>Loading saved records…</div>
        ) : !filtered.length ? (
          <div className={styles.emptyState}>
            {students.length
              ? "No matching student found."
              : "No student records yet. Add your first student above."}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>Grade / Section</th>
                  {SUBJECTS.map((subject) => (
                    <th key={subject.key}>{subject.label}</th>
                  ))}
                  <th>Average</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filtered.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <strong>#{student.rank}</strong>
                    </td>
                    <td>
                      <strong>{student.name}</strong>
                    </td>
                    <td>
                      {student.grade}
                      {student.section ? ` · ${student.section}` : ""}
                    </td>

                    {SUBJECTS.map(({ key }) => (
                      <td key={key}>{student.scores[key]}</td>
                    ))}

                    <td>
                      <span className={styles.average}>
                        {student.average.toFixed(2)}
                      </span>
                    </td>

                    <td>
                      <button
                        className={styles.deleteButton}
                        type="button"
                        onClick={() => removeStudent(student.id)}
                        aria-label={`Delete ${student.name}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className={styles.storageNote}>
          Records are stored locally on this browser/device only.
        </p>
      </section>
    </main>
  );
}
