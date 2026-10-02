"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import bank from "@/data/questions/grade7.json";
import {
  buildSession,
  gradeSession,
  SUBJECTS,
  type Answers,
  type Question,
} from "@/lib/reviewer/quiz";
import styles from "./mock-exam.module.css";
import { buildExamTrend } from "@/lib/reviewer/exam-trend";
import { chooseStudyFocus } from "@/lib/reviewer/study-focus";
import { EXAM_HISTORY_KEY } from "@/lib/reviewer/exam-history";
import {
  parseExamHistoryCsv,
  mergeExamHistory,
} from "@/lib/reviewer/exam-history-import";
import { createExamHistoryCsv } from "@/lib/reviewer/exam-history-export";
import {
  readExamHistory,
  saveExamHistory,
  type ExamHistoryEntry,
} from "@/lib/reviewer/exam-history";
import {
  filterMockExamReview,
  type ReviewMode,
  type ReviewSubject,
} from "@/lib/reviewer/review-filter";
import { parseSavedMockExam } from "@/lib/reviewer/mock-exam-state";

const QUESTION_BANK = bank as Question[];
const EXAM_SECONDS = 60 * 60;
const STORAGE_KEY = "aralkit.mock-exam.v1";
type Phase = "intro" | "exam" | "result";

function timeLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}


function downloadExamHistory(
  history: ExamHistoryEntry[]
) {
  if (history.length === 0) return;

  const csv = createExamHistoryCsv(history);

  // UTF-8 BOM helps Excel recognize the CSV encoding.
  const file = new Blob(
    [String.fromCharCode(0xfeff), csv],
    { type: "text/csv;charset=utf-8" }
  );

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download =
    "aralkit-mock-exam-history-" +
    new Date().toISOString().slice(0, 10) +
    ".csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export default function MockExam() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [hydrated, setHydrated] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [current, setCurrent] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ExamHistoryEntry[]>([]);
  const [importMessage, setImportMessage] = useState("");
  const [reviewMode, setReviewMode] = useState<ReviewMode>("incorrect");
  const [reviewSubject, setReviewSubject] = useState<ReviewSubject>("All");
  const [remaining, setRemaining] = useState(EXAM_SECONDS);

  const deadline = useRef(0);
  const importPicker = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Restore asynchronously to satisfy react-hooks/set-state-in-effect.
    // Strict Mode cleanup also cancels the first scheduled restore.
    const task = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (raw) {
          const saved = parseSavedMockExam(
            raw,
            QUESTION_BANK,
            Date.now()
          );

          if (saved) {
            deadline.current = saved.deadline;
            setQuestions(saved.questions);
            setAnswers(saved.answers);
            setCurrent(saved.current);

            const seconds = Math.max(
              0,
              Math.ceil((saved.deadline - Date.now()) / 1000)
            );

            setRemaining(seconds);
            setPhase(
              saved.phase === "result" || seconds === 0
                ? "result"
                : "exam"
            );
          } else {
            window.localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch {
        // Storage may be blocked; the exam still works.
      }

      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(task);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      if (phase === "intro") {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      if (questions.length !== 40) return;

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          phase,
          questionIds: questions.map((item) => item.id),
          answers,
          current,
          deadline: deadline.current,
        })
      );
    } catch {
      // Storage availability does not affect exam use.
    }
  }, [hydrated, phase, questions, answers, current]);

  useEffect(() => {

    if (phase !== "exam") return;

    const timer = window.setInterval(() => {
      const next = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000)
      );
      setRemaining(next);

      if (next === 0) {
        setPhase("result");
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase]);


  // Save completed attempts. The deadline identifies an attempt,
  // so refreshing the result page cannot create duplicate records.
  useEffect(() => {
    if (
      !hydrated ||
      phase !== "result" ||
      questions.length !== 40 ||
      deadline.current <= 0
    ) {
      return;
    }

    try {
      const graded = gradeSession(questions, answers);

      saveExamHistory(window.localStorage, {
        id: String(deadline.current),
        completedAt: Date.now(),
        correct: graded.correct,
        total: 40,
        subjectScores: {
          Math: graded.perSubject.Math.correct,
          Science: graded.perSubject.Science.correct,
          English: graded.perSubject.English.correct,
          Reasoning: graded.perSubject.Reasoning.correct,
        },
      });
    } catch {
      // Blocked local storage must not prevent exam results.
    }
  }, [hydrated, phase, questions, answers]);

  async function importExamHistoryFile(file: File | null) {
    if (!file) return;

    if (file.size > 65536) {
      setImportMessage("CSV file is too large.");
      return;
    }

    try {
      const text = await file.text();
      const imported = parseExamHistoryCsv(text);

      const existing = readExamHistory(
        window.localStorage
      );

      const merged = mergeExamHistory(
        existing,
        imported
      );

      window.localStorage.setItem(
        EXAM_HISTORY_KEY,
        JSON.stringify(merged)
      );

      setHistory(
        readExamHistory(window.localStorage)
      );

      setImportMessage(
        `CSV checked. ${merged.length} exam attempt(s) saved.`
      );
    } catch (error) {
      setImportMessage(
        error instanceof Error
          ? error.message
          : "Unable to import this CSV."
      );
    }
  }

  function toggleHistory() {
    if (showHistory) {
      setShowHistory(false);
      return;
    }

    try {
      setHistory(readExamHistory(window.localStorage));
    } catch {
      setHistory([]);
    }

    setShowHistory(true);
  }

  function startExam() {

    const selected = buildSession(QUESTION_BANK, 40, "Mixed");
    setQuestions(selected);
    setAnswers({});
    setCurrent(0);
    setRemaining(EXAM_SECONDS);
    deadline.current = Date.now() + EXAM_SECONDS * 1000;
    setShowHistory(false);
    setHistory([]);
    setPhase("exam");
  }

  function submitExam() {
    const unanswered = questions.filter(
      (question) => answers[question.id] === undefined
    ).length;

    if (
      unanswered > 0 &&
      !window.confirm(
        `${unanswered} question(s) unanswered. Submit anyway?`
      )
    ) {
      return;
    }

    setPhase("result");
  }

  const answered = questions.filter(
    (question) => answers[question.id] !== undefined
  ).length;

  const question = questions[current];
  const result =
    phase === "result" ? gradeSession(questions, answers) : null;
  const reviewQuestions = filterMockExamReview(
    questions,
    answers,
    reviewMode,
    reviewSubject
  );

  const focusSubject = chooseStudyFocus(history);

  const progressTrend = buildExamTrend(history);

  const progressHistory = [...history].sort(
    (a, b) => b.completedAt - a.completedAt
  );

  const progressLatest = progressHistory[0];
  const progressPrevious = progressHistory[1];

  const progressAverage =
    progressHistory.length > 0
      ? Math.round(
          (progressHistory.reduce(
            (sum, exam) => sum + exam.correct,
            0
          ) /
            (progressHistory.length * 40)) *
            100
        )
      : 0;

  const progressChange =
    progressLatest && progressPrevious
      ? Math.round((progressLatest.correct / 40) * 100) -
        Math.round((progressPrevious.correct / 40) * 100)
      : null;

  const historyPanel = showHistory ? (
        <section className={styles.card} aria-label="Mock exam history">
          <h2>Previous mock exams</h2>
          <p className={styles.muted}>
            Last 20 completed attempts saved in this browser.
          </p>

          <button
            type="button"
            className={styles.secondary}
            disabled={history.length === 0}
            onClick={() => downloadExamHistory(history)}
            style={{ marginTop: 12 }}
          >
            Download exam history (.csv)
          </button>

          <input
            ref={importPicker}
            type="file"
            accept=".csv,text/csv"
            aria-label="Import exam history CSV"
            hidden
            onChange={(event) => {
              const selected =
                event.currentTarget.files?.[0] ?? null;

              event.currentTarget.value = "";

              void importExamHistoryFile(selected);
            }}
          />

          <button
            type="button"
            className={styles.secondary}
            onClick={() => importPicker.current?.click()}
            style={{ marginTop: 12, marginLeft: 10 }}
          >
            Import exam history (.csv)
          </button>

          {importMessage && (
            <p role="status">{importMessage}</p>
          )}

          {progressLatest && (
            <section aria-label="Exam progress summary">
              <h3>Progress dashboard</h3>

              <div className={styles.stats}>
                <span>
                  Latest score
                  <strong>
                    {progressLatest.correct}/40
                  </strong>
                </span>

                <span>
                  Overall average
                  <strong>
                    {progressAverage}%
                  </strong>
                </span>

                <span>
                  Change from previous
                  <strong>
                    {progressChange === null
                      ? "First attempt"
                      : progressChange > 0
                        ? `Up ${progressChange} points`
                        : progressChange < 0
                          ? `Down ${Math.abs(
                              progressChange
                            )} points`
                          : "No change"}
                  </strong>
                </span>
              </div>

              <section
                className={styles.trendSection}
                aria-label="Mock exam score trend"
              >
                <h3>
                  Score trend · last {progressTrend.length}{" "}
                  {progressTrend.length === 1
                    ? "attempt"
                    : "attempts"}
                </h3>

                <p className={styles.muted}>
                  Oldest to newest · percentage correct
                </p>

                <div className={styles.trendScroller}>
                  <div className={styles.trendBars}>
                    {progressTrend.map((attempt, index) => (
                      <div
                        key={attempt.id}
                        className={styles.trendItem}
                      >
                        <strong className={styles.trendValue}>
                          {attempt.percent}%
                        </strong>

                        <div
                          className={styles.trendBarTrack}
                          role="img"
                          aria-label={`Attempt ${index + 1}: ${attempt.correct} of 40 correct, ${attempt.percent}%`}
                        >
                          <div
                            className={styles.trendBarFill}
                            style={{
                              height: `${attempt.percent}%`,
                            }}
                          />
                        </div>

                        <span className={styles.trendDate}>
                          {new Date(
                            attempt.completedAt
                          ).toLocaleDateString("en-PH", {
                            timeZone: "Asia/Manila",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>

                        <span className={styles.trendScore}>
                          {attempt.correct}/40
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <h3>Average score by subject</h3>

              <div className={styles.subjectGrid}>
                {SUBJECTS.map((subject) => {
                  const average =
                    progressHistory.reduce(
                      (sum, exam) =>
                        sum +
                        exam.subjectScores[subject],
                      0
                    ) / progressHistory.length;

                  return (
                    <div
                      key={subject}
                      className={styles.subject}
                    >
                      <strong>
                        {subject === "Math"
                          ? "Mathematics"
                          : subject}
                      </strong>
                      <span>
                        {average.toFixed(1)}/10
                      </span>
                    </div>
                  );
                })}
              </div>
              {focusSubject && (
                <div
                  className={styles.subject}
                  style={{ marginTop: 16 }}
                >
                  <strong>Suggested next practice</strong>

                  <p>
                    {focusSubject === "Math"
                      ? "Mathematics"
                      : focusSubject}
                    {" · "}10 questions
                  </p>

                  <p>
                    Based on your lowest average subject
                    score across saved mock exams. In the
                    Grade 7 Reviewer, choose this subject
                    and a 10-question session.
                  </p>

                  <Link
                    href={`/reviewer/?subject=${focusSubject}&count=10`}
                  >
                    Practice{" "}
                    {focusSubject === "Math"
                      ? "Mathematics"
                      : focusSubject}
                    {" "}(10 questions) →
                  </Link>
                </div>
              )}
            </section>
          )}

          {history.length === 0 ? (
            <p>No completed attempts saved yet.</p>
          ) : (
            <ol>
              {history.map((entry) => (
                <li key={entry.id} className={styles.review}>
                  <strong>
                    {entry.correct}/{entry.total} correct
                    {" · "}
                    {Math.round(
                      (entry.correct / entry.total) * 100
                    )}%
                  </strong>

                  <p className={styles.muted}>
                    {new Date(
                      entry.completedAt
                    ).toLocaleString("en-PH")}
                  </p>

                  <p>
                    Mathematics {entry.subjectScores.Math}/10
                    {" · "}
                    Science {entry.subjectScores.Science}/10
                    {" · "}
                    English {entry.subjectScores.English}/10
                    {" · "}
                    Reasoning {entry.subjectScores.Reasoning}/10
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
  ) : null;

  return (
    <main className={styles.shell}>
      <Link href="/reviewer/" className={styles.back}>
        ← Grade 7 Reviewer
      </Link>

      <p className={styles.eyebrow}>AralKit PH · Grade 7</p>
      <h1>Mock Exam</h1>
      <p className={styles.lead}>
        Original practice questions. Not an official Manila Science
        High School admission examination.
      </p>

      {phase === "intro" && hydrated && (
        <section className={styles.card}>
          <h2>Exam instructions</h2>
          <div className={styles.stats}>
            <span><strong>40</strong> questions</span>
            <span><strong>60</strong> minutes</span>
            <span><strong>4</strong> subjects</span>
          </div>

          <p>
            Mathematics, Science, English, and Reasoning each have
            10 randomized questions. Select one answer per question.
            You can move backward and forward before submitting.
          </p>
          <p>
            Your exam submits automatically when the timer reaches
            zero. Results include scores by subject and explanations.
          </p>

          <button
            type="button"
            className={styles.primary}
            onClick={startExam}
          >
            Start mock exam
          </button>

          <button
            type="button"
            className={styles.secondary}
            onClick={toggleHistory}
            style={{ marginLeft: 10, marginTop: 10 }}
          >
            {showHistory ? "Hide exam history" : "View exam history"}
          </button>
        </section>
      )}

      {phase === "exam" && question && (
        <>
          <section className={styles.card}>
            <div className={styles.top}>
              <strong>
                Question {current + 1} of {questions.length}
              </strong>
              <strong
                className={remaining <= 300 ? styles.urgent : ""}
                role="timer"
                aria-label="Time remaining"
              >
                {timeLabel(remaining)}
              </strong>
            </div>

            <p className={styles.muted}>
              {answered}/{questions.length} answered · {question.subject}
            </p>

            <div
              className={styles.progress}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={questions.length}
              aria-valuenow={answered}
              aria-label="Questions answered"
            >
              <span
                style={{
                  width: `${(answered / questions.length) * 100}%`,
                }}
              />
            </div>

            <h2>{question.prompt}</h2>
            <fieldset className={styles.choices}>
              <legend className={styles.srOnly}>
                Select one answer
              </legend>

              {question.options.map((option, index) => (
                <label
                  key={index}
                  className={styles.choice}
                >
                  <input
                    type="radio"
                    name={`answer-${question.id}`}
                    checked={answers[question.id] === index}
                    onChange={() =>
                      setAnswers((previous) => ({
                        ...previous,
                        [question.id]: index,
                      }))
                    }
                  />
                  <span>
                    {String.fromCharCode(65 + index)}. {option}
                  </span>
                </label>
              ))}
            </fieldset>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                disabled={current === 0}
                onClick={() => setCurrent((value) => value - 1)}
              >
                Previous
              </button>

              {current < questions.length - 1 ? (
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => setCurrent((value) => value + 1)}
                >
                  Next question
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.primary}
                  onClick={submitExam}
                >
                  Submit exam
                </button>
              )}
            </div>
          </section>

          <section
            className={styles.card}
            aria-label="Question navigation"
          >
            <h2>Jump to a question</h2>
            <div className={styles.numberGrid}>
              {questions.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={[
                    styles.number,
                    index === current ? styles.current : "",
                    answers[item.id] !== undefined
                      ? styles.answered
                      : "",
                  ].join(" ")}
                  aria-label={`Question ${index + 1}${
                    answers[item.id] !== undefined
                      ? ", answered"
                      : ", unanswered"
                  }`}
                  aria-current={
                    index === current ? "step" : undefined
                  }
                  onClick={() => setCurrent(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={styles.submit}
              onClick={submitExam}
            >
              Submit exam now
            </button>
          </section>
        </>
      )}

      {phase === "result" && result && (
        <>
          <section className={styles.card}>
            <p className={styles.eyebrow}>Exam completed</p>
            <h2>
              {result.correct}/{result.total} correct
            </h2>
            <p className={styles.score}>
              {result.percent}%
            </p>
            <p>
              {questions.length - answered} unanswered question(s).
              Review the answers and explanations below.
            </p>

            <h3>Score by subject</h3>
            <div className={styles.subjectGrid}>
              {SUBJECTS.map((subject) => {
                const score = result.perSubject[subject];

                return (
                  <div key={subject} className={styles.subject}>
                    <strong>
                      {subject === "Math"
                        ? "Mathematics"
                        : subject}
                    </strong>
                    <span>
                      {score.correct}/{score.total} · {score.percent}%
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className={styles.primary}
              onClick={startExam}
            >
              Try a new mock exam
            </button>

            <button
              type="button"
              className={styles.secondary}
              onClick={toggleHistory}
              style={{ marginLeft: 10, marginTop: 10 }}
            >
              {showHistory ? "Hide exam history" : "View exam history"}
            </button>
          </section>

          {historyPanel}

          <section
            className={styles.card}
            aria-label="Answer review"
          >
            <h2>Answer review</h2>

            <div className={styles.reviewToolbar}>
              <label>
                Show
                <select
                  value={reviewMode}
                  onChange={(event) =>
                    setReviewMode(event.target.value as ReviewMode)
                  }
                >
                  <option value="incorrect">Incorrect only</option>
                  <option value="all">All questions</option>
                </select>
              </label>

              <label>
                Subject
                <select
                  value={reviewSubject}
                  onChange={(event) =>
                    setReviewSubject(
                      event.target.value as ReviewSubject
                    )
                  }
                >
                  <option value="All">All subjects</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject === "Math"
                        ? "Mathematics"
                        : subject}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className={styles.reviewCount}>
              Showing {reviewQuestions.length} of {questions.length}
              {" "}questions
            </p>

            {reviewQuestions.length === 0 && (
              <p>No questions match this filter.</p>
            )}

            {reviewQuestions.map(({ item, index }) => {
              const selected = answers[item.id];
              const correct = selected === item.answer;

              return (
                <article
                  key={item.id}
                  className={styles.review}
                >
                  <p className={styles.muted}>
                    {index + 1}. {item.subject}
                  </p>
                  <h3>{item.prompt}</h3>
                  <p>
                    Your answer:{" "}
                    <strong>
                      {selected === undefined
                        ? "Unanswered"
                        : item.options[selected]}
                    </strong>
                    {" · "}
                    {correct ? "Correct" : "Incorrect"}
                  </p>
                  <p>
                    Correct answer:{" "}
                    <strong>
                      {item.options[item.answer]}
                    </strong>
                  </p>
                  <p>{item.explanation}</p>
                </article>
              );
            })}
          </section>
        </>
      )}
      {phase === "intro" && historyPanel}
    </main>
  );
}
