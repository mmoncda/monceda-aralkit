"use client";

import { useState } from "react";

import {
  generateWorksheet,
  type Difficulty,
  type Operation,
  type Problem,
} from "@/lib/worksheets/math";

export default function WorksheetGenerator() {
  const [operation, setOperation] =
    useState<Operation>("addition");

  const [difficulty, setDifficulty] =
    useState<Difficulty>("easy");

  const [count, setCount] = useState(10);

  const [showAnswers, setShowAnswers] =
    useState(false);

  const [problems, setProblems] =
    useState<Problem[]>([]);

  const [worksheetTitle, setWorksheetTitle] =
    useState("");

  const activityName =
    operation.charAt(0).toUpperCase() +
    operation.slice(1);

  function generate() {
    setProblems(
      generateWorksheet({
        operation,
        difficulty,
        count,
      })
    );
  }

  return (
    <section className="tool-page worksheet-page">

      <div className="worksheet-controls">
        <span className="pill">
          Free School Tool
        </span>

        <h1>Math Worksheet Generator</h1>

        <p>
          Create printable math activities
          with an optional answer key.
        </p>

        <div className="calculator">
          <div className="worksheet-fields">

            <label>
              Math Operation
              <select
                value={operation}
                onChange={(event) =>
                  setOperation(
                    event.target.value as Operation
                  )
                }
              >
                <option value="addition">Addition</option>
                <option value="subtraction">Subtraction</option>
                <option value="multiplication">Multiplication</option>
                <option value="division">Division</option>
              </select>
            </label>

            <label>
              Difficulty
              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(
                    event.target.value as Difficulty
                  )
                }
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>

            <label>
              Questions
              <select
                value={count}
                onChange={(event) =>
                  setCount(Number(event.target.value))
                }
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </label>

          </div>

          <label className="worksheet-title-label">
            Worksheet Title (optional)

            <input
              type="text"
              maxLength={80}
              value={worksheetTitle}
              placeholder="My Math Practice"
              onChange={(event) =>
                setWorksheetTitle(event.target.value)
              }
            />
          </label>

          <label className="worksheet-checkbox">
            <input
              type="checkbox"
              checked={showAnswers}
              onChange={(event) =>
                setShowAnswers(event.target.checked)
              }
            />

            Include separate answer key
          </label>

          <button
            type="button"
            className="primary-button"
            onClick={generate}
          >
            Generate Worksheet
          </button>

        </div>
      </div>

      {problems.length === 0 && (
        <div className="worksheet-empty">
          Choose your settings and generate
          your first worksheet.
        </div>
      )}

      {problems.length > 0 && (
        <>
          <div className="worksheet-print-button">
            <button
              type="button"
              className="primary-button"
              onClick={() => window.print()}
            >
              Print / Save as PDF
            </button>
          </div>

          <article className="worksheet-paper">

            <header className="worksheet-heading">
              <h2>AralKit PH</h2>
              <h3>
                {worksheetTitle.trim() ||
                  `${activityName} Practice`}
              </h3>
              <p>Difficulty: {difficulty}</p>
            </header>

            <div className="worksheet-student">
              <p>Name: ____________________</p>
              <p>Grade & Section: ___________</p>
              <p>Date: _____________________</p>
            </div>

            <p className="worksheet-instruction">
              Solve each problem. Write your
              answers in the blanks.
            </p>

            <ol className="worksheet-list">
              {problems.map((problem) => (
                <li key={problem.id}>
                  <span>
                    {problem.id}.{" "}
                    {problem.left}{" "}
                    {problem.operator}{" "}
                    {problem.right}
                  </span>

                  <span className="worksheet-blank">
                    = _______
                  </span>
                </li>
              ))}
            </ol>

            <p className="worksheet-brand">
              AralKit PH · by Monceda Labs ⭐
            </p>

          </article>

          {showAnswers && (
            <article className="worksheet-paper worksheet-answer-key">

              <header className="worksheet-heading">
                <h2>Answer Key</h2>
                <h3>
                  {worksheetTitle.trim() ||
                    `${activityName} Practice`}
                </h3>
              </header>

              <ol className="worksheet-list">
                {problems.map((problem) => (
                  <li key={problem.id}>
                    {problem.id}.{" "}
                    {problem.left}{" "}
                    {problem.operator}{" "}
                    {problem.right}{" "}
                    = {problem.answer}
                  </li>
                ))}
              </ol>

              <p className="worksheet-brand">
                AralKit PH · by Monceda Labs ⭐
              </p>

            </article>
          )}
        </>
      )}

    </section>
  );
}
