"use client";

import { useState } from "react";

import {
  COVER_TEMPLATES,
  normalizeCover,
  type CoverFields,
  type CoverTemplate,
} from "@/lib/cover/cover";

const initialFields: CoverFields = {
  title: "",
  student: "",
  gradeSection: "",
  subject: "",
  teacher: "",
  school: "",
  date: "",
};

export default function CoverMaker() {
  const [fields, setFields] =
    useState<CoverFields>({
      ...initialFields,
    });

  const [template, setTemplate] =
    useState<CoverTemplate>("classic");

  const cover = normalizeCover(fields);

  function update(
    key: keyof CoverFields,
    value: string
  ) {
    setFields((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function reset() {
    setFields({
      ...initialFields,
    });

    setTemplate("classic");
  }

  return (
    <section className="tool-page cover-page">

      <div className="cover-controls">

        <span className="pill">
          Free School Tool
        </span>

        <h1>
          School Cover Page Maker
        </h1>

        <p>
          Create a printable project cover
          for your school activities.
        </p>

        <div className="calculator">

          <h2 className="text-xl font-bold">
            Choose Your Design
          </h2>

          <div className="cover-templates">
            {COVER_TEMPLATES.map(
              (item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={
                    template === item.id
                  }
                  className={
                    template === item.id
                      ? "cover-template selected"
                      : "cover-template"
                  }
                  onClick={() =>
                    setTemplate(item.id)
                  }
                >
                  {item.name}
                </button>
              )
            )}
          </div>

          <h2 className="text-xl font-bold">
            School Information
          </h2>

          <div className="cover-fields">

            <label>
              Project Title

              <input
                type="text"
                maxLength={100}
                value={fields.title}
                placeholder="My School Project"
                onChange={(event) =>
                  update(
                    "title",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Student Name

              <input
                type="text"
                maxLength={100}
                value={fields.student}
                placeholder="Student name"
                onChange={(event) =>
                  update(
                    "student",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Grade and Section

              <input
                type="text"
                maxLength={100}
                value={fields.gradeSection}
                placeholder="Grade VI - Section"
                onChange={(event) =>
                  update(
                    "gradeSection",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Subject

              <input
                type="text"
                maxLength={100}
                value={fields.subject}
                placeholder="Science"
                onChange={(event) =>
                  update(
                    "subject",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Teacher Name (optional)

              <input
                type="text"
                maxLength={100}
                value={fields.teacher}
                placeholder="Teacher name"
                onChange={(event) =>
                  update(
                    "teacher",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              School Name

              <input
                type="text"
                maxLength={120}
                value={fields.school}
                placeholder="School name"
                onChange={(event) =>
                  update(
                    "school",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Submission Date

              <input
                type="date"
                value={fields.date}
                onChange={(event) =>
                  update(
                    "date",
                    event.target.value
                  )
                }
              />
            </label>

          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={reset}
          >
            Reset Cover
          </button>

        </div>

      </div>

      <div className="cover-print-button">
        <button
          type="button"
          className="primary-button"
          onClick={() =>
            window.print()
          }
        >
          Print / Save as PDF
        </button>
      </div>

      <div
        className={
          `cover-sheet cover-${template}`
        }
        aria-label="Cover page preview"
      >

        <div className="cover-top">

          <p className="cover-school">
            {cover.school}
          </p>

          <div className="cover-symbol">
            🎓
          </div>

        </div>

        <div className="cover-center">

          <p className="cover-eyebrow">
            SCHOOL PROJECT
          </p>

          <h2>
            {cover.title}
          </h2>

          <p className="cover-subject">
            {cover.subject}
          </p>

        </div>

        <div className="cover-bottom">

          <div className="cover-info">
            <span>
              Submitted by
            </span>

            <strong>
              {cover.student}
            </strong>

            <p>
              {cover.gradeSection}
            </p>
          </div>

          {cover.teacher && (
            <div className="cover-info">
              <span>
                Submitted to
              </span>

              <strong>
                {cover.teacher}
              </strong>
            </div>
          )}

          {cover.date && (
            <p className="cover-date">
              {cover.date}
            </p>
          )}

        </div>

      </div>

      <p className="cover-status">
        Your cover is prepared in your
        browser. No account or upload required.
      </p>

    </section>
  );
}
