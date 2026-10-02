"use client";

import { useRef, useState } from "react";

import {
  calculateAverage,
} from "@/lib/grades/calculate";

type Subject = {
  id: number;
  name: string;
  grade: string;
};

const MAX_SUBJECTS = 30;

export default function GradeCalculator() {

  const nextId = useRef(2);

  const [subjects, setSubjects] = useState<
    Subject[]
  >([
    {
      id: 1,
      name: "",
      grade: "",
    },
  ]);

  const result = calculateAverage(subjects);

  function update(
    id: number,
    field: "name" | "grade",
    value: string
  ) {

    setSubjects((previous) =>
      previous.map((subject) =>
        subject.id === id
          ? {
              ...subject,
              [field]: value,
            }
          : subject
      )
    );

  }

  function addSubject() {

    if (subjects.length >= MAX_SUBJECTS) {
      return;
    }

    const id = nextId.current++;

    setSubjects((previous) => [
      ...previous,
      {
        id,
        name: "",
        grade: "",
      },
    ]);

  }

  function removeSubject(id: number) {

    setSubjects((previous) =>
      previous.filter(
        (subject) => subject.id !== id
      )
    );

  }

  function reset() {

    const id = nextId.current++;

    setSubjects([
      {
        id,
        name: "",
        grade: "",
      },
    ]);

  }

  return (
    <section className="tool-page">

      <span className="pill">
        Free School Tool
      </span>

      <h1>
        Grade Average Calculator
      </h1>

      <p>
        Calculate your general average
        quickly and easily.
      </p>

      <p>
        Maglagay ng subjects at grades
        para makuha ang iyong average.
      </p>

      <div className="calculator">

        <h2 className="mb-4 text-xl font-bold">
          My Subjects
        </h2>

        {subjects.map((subject, index) => (

          <div
            className="subject-row"
            key={subject.id}
          >

            <input
              aria-label={
                `Subject ${index + 1}`
              }
              placeholder="Subject name"
              value={subject.name}
              maxLength={100}
              onChange={(event) =>
                update(
                  subject.id,
                  "name",
                  event.target.value
                )
              }
            />

            <input
              aria-label={
                `Grade ${index + 1}`
              }
              placeholder="Grade"
              type="number"
              min="0"
              max="100"
              step="any"
              value={subject.grade}
              onChange={(event) =>
                update(
                  subject.id,
                  "grade",
                  event.target.value
                )
              }
            />

            <button
              type="button"
              className="remove-button"
              aria-label={
                `Remove subject ${index + 1}`
              }
              onClick={() =>
                removeSubject(subject.id)
              }
            >
              ×
            </button>

          </div>

        ))}

        <div className="actions">

          <button
            type="button"
            className="secondary-button"
            onClick={addSubject}
            disabled={
              subjects.length >= MAX_SUBJECTS
            }
          >
            + Add Subject
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={reset}
          >
            Reset
          </button>

        </div>

        <div
          className="result"
          aria-live="polite"
        >

          <p>General Average</p>

          <strong>
            {result.average === null
              ? "—"
              : result.average.toFixed(2)}
          </strong>

          <p>
            Subjects: {result.subjectCount}
          </p>

        </div>

        {result.status === "empty" && (
          <p className="mt-4">
            Enter your subjects and grades
            to get started.
          </p>
        )}

        {result.errors.length > 0 && (

          <div
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-4 text-red-800"
          >

            <p className="font-bold">
              Please correct the following:
            </p>

            <ul className="mt-2 list-disc pl-5">

              {result.errors.map(
                (error, index) => (
                  <li key={index}>
                    {error}
                  </li>
                )
              )}

            </ul>

          </div>

        )}

        {result.status === "valid" && (

          <button
            type="button"
            className="primary-button"
            onClick={() => window.print()}
          >
            Print / Save as PDF
          </button>

        )}

        <p className="note">
          This calculator uses equal
          subject weights. Official grading
          and honors eligibility depend on
          applicable school rules.
        </p>

      </div>

    </section>
  );

}
