"use client";

import { useEffect, useState } from "react";

import bank from "@/data/questions/grade7.json";

import {
  buildSession,
  gradeSession,
  type Answers,
  type Question,
} from "@/lib/reviewer/quiz";

const QUESTION_BANK = bank as Question[];

const PRACTICE_SECONDS = 25 * 60;

type Stage = "intro" | "quiz" | "results";

export default function ReviewerPage() {
  const [stage, setStage] = useState<Stage>(
    "intro"
  );

  const [timerEnabled, setTimerEnabled] =
    useState(true);

  const [remaining, setRemaining] =
    useState(PRACTICE_SECONDS);

  const [questions, setQuestions] = useState<
    Question[]
  >([]);

  const [answers, setAnswers] = useState<
    Answers
  >({});

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (stage !== "quiz" || !timerEnabled) {
      return;
    }

    const interval = window.setInterval(() => {
      setRemaining((value) =>
        Math.max(0, value - 1)
      );
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [stage, timerEnabled]);

  const timedOut =
    stage === "quiz" &&
    timerEnabled &&
    remaining === 0;

  const finished =
    stage === "results" || timedOut;

  const result = gradeSession(
    questions,
    answers
  );

  const answeredCount = questions.filter(
    (question) =>
      answers[question.id] !== undefined
  ).length;

  function start() {
    setQuestions(
      buildSession(QUESTION_BANK)
    );
    setAnswers({});
    setCurrent(0);
    setRemaining(PRACTICE_SECONDS);
    setStage("quiz");
  }

  function retryIncorrect() {
    const incorrect = questions.filter(
      (question) =>
        result.wrongIds.includes(
          question.id
        )
    );

    setQuestions(incorrect);
    setAnswers({});
    setCurrent(0);
    setRemaining(PRACTICE_SECONDS);
    setStage("quiz");
  }

  const minutes = String(
    Math.floor(remaining / 60)
  ).padStart(2, "0");

  const seconds = String(
    remaining % 60
  ).padStart(2, "0");

  if (stage === "intro") {
    return (
      <section className="tool-page">
        <span className="pill">
          Free Practice Reviewer
        </span>

        <h1>
          Grade 7 Entrance Exam Reviewer
        </h1>

        <p>
          Practice Mathematics, Science,
          English, and Logical Reasoning.
        </p>

        <div className="calculator">
          <h2 className="text-xl font-bold">
            Practice Session
          </h2>

          <p>15 randomized questions</p>
          <p>4 subjects</p>
          <p>Answers with explanations</p>

          <label className="reviewer-check">
            <input
              type="checkbox"
              checked={timerEnabled}
              onChange={(event) =>
                setTimerEnabled(
                  event.target.checked
                )
              }
            />

            Enable 25-minute timer
          </label>

          <button
            type="button"
            className="primary-button"
            onClick={start}
          >
            Start Practice
          </button>
        </div>

        <p className="note">
          Original general practice questions.
          Not an official entrance examination
          of any particular school.
        </p>
      </section>
    );
  }

  if (finished) {
    return (
      <section className="tool-page">
        <span className="pill">
          Practice Results
        </span>

        <h1>
          {timedOut
            ? "Time is up!"
            : "Practice complete!"}
        </h1>

        <div
          className="result"
          aria-live="polite"
        >
          <p>Your Score</p>

          <strong>
            {result.correct}/{result.total}
          </strong>

          <p>{result.percent}% correct</p>
        </div>

        <h2 className="section-title">
          Answer Review
        </h2>

        {questions.map(
          (question, index) => {
            const chosen =
              answers[question.id];

            const correct =
              chosen === question.answer;

            return (
              <article
                className="reviewer-review"
                key={question.id}
              >
                <span className="pill">
                  {question.subject}
                </span>

                <h3>
                  {index + 1}.{" "}
                  {question.prompt}
                </h3>

                <p>
                  Your answer:{" "}
                  {chosen === undefined
                    ? "Not answered"
                    : question.options[
                        chosen
                      ]}
                </p>

                <p>
                  Correct answer:{" "}
                  {
                    question.options[
                      question.answer
                    ]
                  }
                </p>

                <p
                  className={
                    correct
                      ? "reviewer-correct"
                      : "reviewer-wrong"
                  }
                >
                  {correct
                    ? "Correct"
                    : "Incorrect"}
                </p>

                <p>
                  {question.explanation}
                </p>
              </article>
            );
          }
        )}

        <div className="actions">
          {result.wrongIds.length > 0 && (
            <button
              type="button"
              className="primary-button"
              onClick={retryIncorrect}
            >
              Retry Incorrect Answers
            </button>
          )}

          <button
            type="button"
            className="primary-button"
            onClick={start}
          >
            New 15-Question Session
          </button>
        </div>
      </section>
    );
  }

  const question = questions[current];

  if (!question) {
    return (
      <section className="tool-page">
        <h1>No question available.</h1>
      </section>
    );
  }

  return (
    <section className="tool-page">
      <span className="pill">
        {question.subject}
      </span>

      <h1>Grade 7 Practice</h1>

      <div className="reviewer-meta">
        <span>
          Question {current + 1} of{" "}
          {questions.length}
        </span>

        <span>
          Answered: {answeredCount}/
          {questions.length}
        </span>

        {timerEnabled && (
          <span
            aria-label="Time remaining"
            role="timer"
          >
            {minutes}:{seconds}
          </span>
        )}
      </div>

      <div className="calculator">
        <h2 className="text-xl font-bold">
          {question.prompt}
        </h2>

        <div className="reviewer-options">
          {question.options.map(
            (option, index) => (
              <button
                type="button"
                key={index}
                aria-pressed={
                  answers[
                    question.id
                  ] === index
                }
                className={
                  answers[
                    question.id
                  ] === index
                    ? "reviewer-option selected"
                    : "reviewer-option"
                }
                onClick={() =>
                  setAnswers(
                    (previous) => ({
                      ...previous,
                      [question.id]:
                        index,
                    })
                  )
                }
              >
                {String.fromCharCode(
                  65 + index
                )}. {option}
              </button>
            )
          )}
        </div>

        <div className="actions">
          <button
            type="button"
            className="secondary-button"
            disabled={current === 0}
            onClick={() =>
              setCurrent(
                (value) => value - 1
              )
            }
          >
            Previous
          </button>

          {current <
          questions.length - 1 ? (
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                setCurrent(
                  (value) => value + 1
                )
              }
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                setStage("results")
              }
            >
              Submit Answers
            </button>
          )}
        </div>
      </div>

      <p className="note">
        You can return to previous
        questions before submission.
        Unanswered items count as incorrect.
      </p>
    </section>
  );
}
