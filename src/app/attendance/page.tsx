"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import styles from "./attendance.module.css";

type AttendanceStatus = "Present" | "Absent" | "Late";

type AttendanceRecord = {
  id: string;
  name: string;
  grade: string;
  section: string;
  date: string;
  status: AttendanceStatus;
  createdAt: string;
};

const STORAGE_KEY = "aralkit-attendance-v1";

function csvEscape(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
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

function downloadCsv(
  filename: string,
  rows: (string | number)[][],
) {
  const csv = rows
    .map((row) =>
      row.map((value) => csvEscape(value)).join(","),
    )
    .join("\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [ready, setReady] = useState(false);

  const [name, setName] = useState("");
  const [grade, setGrade] = useState("Grade 6");
  const [section, setSection] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] =
    useState<AttendanceStatus>("Present");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] =
    useState<"All" | AttendanceStatus>("All");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);

        if (stored) {
          const parsed = JSON.parse(stored);

          if (Array.isArray(parsed)) {
            setRecords(parsed);
          }
        }
      } catch {
        // Ignore malformed local storage.
      } finally {
        setReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records),
    );
  }, [records, ready]);

  const summary = useMemo(() => {
    const present = records.filter(
      (record) => record.status === "Present",
    ).length;

    const absent = records.filter(
      (record) => record.status === "Absent",
    ).length;

    const late = records.filter(
      (record) => record.status === "Late",
    ).length;

    const attended = present + late;
    const attendanceRate = records.length
      ? (attended / records.length) * 100
      : 0;

    return {
      present,
      absent,
      late,
      attendanceRate,
    };
  }, [records]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...records]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      )
      .filter((record) => {
        const matchesSearch =
          !query ||
          `${record.name} ${record.grade} ${record.section} ${record.date}`
            .toLowerCase()
            .includes(query);

        const matchesStatus =
          filterStatus === "All" ||
          record.status === filterStatus;

        return matchesSearch && matchesStatus;
      });
  }, [records, search, filterStatus]);

  function submitRecord(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim() || !date) return;

    const record: AttendanceRecord = {
      id: crypto.randomUUID(),
      name: name.trim(),
      grade,
      section: section.trim(),
      date,
      status,
      createdAt: new Date().toISOString(),
    };

    setRecords((current) => [
      ...current,
      record,
    ]);

    setName("");
    setSection("");
    setStatus("Present");
  }

  function removeRecord(id: string) {
    setRecords((current) =>
      current.filter((record) => record.id !== id),
    );
  }

  function clearAll() {
    if (!records.length) return;

    const confirmed = window.confirm(
      "Delete all attendance records on this device?",
    );

    if (confirmed) {
      setRecords([]);
    }
  }

  function downloadTemplate() {
    downloadCsv("aralkit-attendance-template.csv", [
      [
        "Student",
        "Grade",
        "Section",
        "Date",
        "Status",
      ],
      [
        "Juan Dela Cruz",
        "Grade 6",
        "Jacinto",
        "2026-10-03",
        "Present",
      ],
      [
        "Maria Santos",
        "Grade 6",
        "Jacinto",
        "2026-10-03",
        "Late",
      ],
    ]);
  }

  function exportCsv() {
    if (!records.length) return;

    downloadCsv("aralkit-attendance-records.csv", [
      [
        "Student",
        "Grade",
        "Section",
        "Date",
        "Status",
      ],
      ...records.map((record) => [
        record.name,
        record.grade,
        record.section,
        record.date,
        record.status,
      ]),
    ]);
  }

  function importCsv(
    event: ChangeEvent<HTMLInputElement>,
  ) {
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

        const expected = [
          "Student",
          "Grade",
          "Section",
          "Date",
          "Status",
        ];

        const header = parseCsvLine(lines[0]);

        const validHeader =
          header.length === expected.length &&
          expected.every(
            (column, index) =>
              header[index]?.toLowerCase() ===
              column.toLowerCase(),
          );

        if (!validHeader) {
          window.alert(
            "Invalid CSV format. Please use the downloadable AralKit Attendance template.",
          );
          return;
        }

        const imported: AttendanceRecord[] = [];

        for (
          let index = 1;
          index < lines.length;
          index += 1
        ) {
          const row = parseCsvLine(lines[index]);

          if (row.length !== expected.length) continue;

          const studentName = row[0]?.trim();
          const gradeLevel = row[1]?.trim();
          const sectionName = row[2]?.trim();
          const attendanceDate = row[3]?.trim();
          const rawStatus = row[4]?.trim();

          const validStatus = [
            "Present",
            "Absent",
            "Late",
          ].includes(rawStatus);

          if (
            !studentName ||
            !gradeLevel ||
            !attendanceDate ||
            !validStatus
          ) {
            continue;
          }

          imported.push({
            id: crypto.randomUUID(),
            name: studentName,
            grade: gradeLevel,
            section: sectionName,
            date: attendanceDate,
            status: rawStatus as AttendanceStatus,
            createdAt: new Date().toISOString(),
          });
        }

        if (!imported.length) {
          window.alert(
            "No valid attendance rows were found.",
          );
          return;
        }

        setRecords((current) => [
          ...current,
          ...imported,
        ]);

        window.alert(
          `${imported.length} attendance record${
            imported.length === 1 ? "" : "s"
          } imported.`,
        );
      } catch {
        window.alert(
          "The CSV could not be read.",
        );
      } finally {
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>
          AralKit Student Tools
        </span>

        <h1>Attendance Tracker</h1>

        <p>
          Record daily attendance, track present,
          absent, and late entries, and export class
          attendance to CSV.
        </p>
      </section>

      <section className={styles.stats}>
        <article>
          <span>Total Records</span>
          <strong>{records.length}</strong>
        </article>

        <article>
          <span>Present</span>
          <strong>{summary.present}</strong>
        </article>

        <article>
          <span>Absent</span>
          <strong>{summary.absent}</strong>
        </article>

        <article>
          <span>Late</span>
          <strong>{summary.late}</strong>
        </article>

        <article>
          <span>Attendance Rate</span>
          <strong>
            {records.length
              ? `${summary.attendanceRate.toFixed(1)}%`
              : "—"}
          </strong>
        </article>
      </section>

      <section className={styles.csvPanel}>
        <div>
          <span className={styles.miniLabel}>
            Bulk Attendance
          </span>

          <h2>CSV Import / Export</h2>

          <p>
            Use the official AralKit format for bulk
            attendance records.
          </p>
        </div>

        <div className={styles.csvActions}>
          <button
            type="button"
            onClick={downloadTemplate}
          >
            Download Template
          </button>

          <label>
            Import CSV
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={importCsv}
              hidden
            />
          </label>

          <button
            type="button"
            onClick={exportCsv}
            disabled={!records.length}
          >
            Export CSV
          </button>
        </div>
      </section>

      <section className={styles.formCard}>
        <div>
          <span className={styles.miniLabel}>
            New Attendance
          </span>
          <h2>Add Record</h2>
        </div>

        <form
          className={styles.form}
          onSubmit={submitRecord}
        >
          <label>
            Student Name
            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="e.g. Juan Dela Cruz"
              required
            />
          </label>

          <label>
            Grade
            <select
              value={grade}
              onChange={(event) =>
                setGrade(event.target.value)
              }
            >
              {Array.from(
                { length: 12 },
                (_, index) => (
                  <option key={index + 1}>
                    Grade {index + 1}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Section
            <input
              value={section}
              onChange={(event) =>
                setSection(event.target.value)
              }
              placeholder="e.g. Jacinto"
            />
          </label>

          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
              required
            />
          </label>

          <label>
            Status
            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as AttendanceStatus,
                )
              }
            >
              <option>Present</option>
              <option>Absent</option>
              <option>Late</option>
            </select>
          </label>

          <button type="submit">
            Add Record
          </button>
        </form>
      </section>

      <section className={styles.tableCard}>
        <div className={styles.toolbar}>
          <div>
            <span className={styles.miniLabel}>
              Attendance Records
            </span>
            <h2>Daily Attendance</h2>
          </div>

          <div className={styles.filters}>
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search student, grade, section…"
            />

            <select
              value={filterStatus}
              onChange={(event) =>
                setFilterStatus(
                  event.target.value as
                    | "All"
                    | AttendanceStatus,
                )
              }
            >
              <option>All</option>
              <option>Present</option>
              <option>Absent</option>
              <option>Late</option>
            </select>

            <button
              type="button"
              className={styles.clearButton}
              onClick={clearAll}
              disabled={!records.length}
            >
              Clear All
            </button>
          </div>
        </div>

        {!ready ? (
          <div className={styles.empty}>
            Loading saved records…
          </div>
        ) : !filtered.length ? (
          <div className={styles.empty}>
            {records.length
              ? "No matching attendance records."
              : "No attendance records yet."}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Grade / Section</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filtered.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <strong>{record.name}</strong>
                    </td>

                    <td>
                      {record.grade}
                      {record.section
                        ? ` · ${record.section}`
                        : ""}
                    </td>

                    <td>{record.date}</td>

                    <td>
                      <span
                        className={`${styles.status} ${
                          styles[
                            record.status.toLowerCase()
                          ]
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() =>
                          removeRecord(record.id)
                        }
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

        <p className={styles.note}>
          Attendance records are stored locally on this
          browser/device only.
        </p>
      </section>
    </main>
  );
}
