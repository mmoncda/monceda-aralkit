"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import styles from "./schedule.module.css";

const STORAGE_KEY = "aralkit-class-schedule-v1";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

type SchoolDay = (typeof DAYS)[number];

type ScheduleItem = {
  id: string;
  day: SchoolDay;
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string;
  room: string;
};

function formatTime(value: string) {
  if (!value) return "";

  const [hourString, minute] = value.split(":");
  const hour = Number(hourString);

  if (!Number.isFinite(hour)) return value;

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
}

export default function SchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [ready, setReady] = useState(false);

  const [day, setDay] = useState<SchoolDay>("Monday");
  const [startTime, setStartTime] = useState("07:30");
  const [endTime, setEndTime] = useState("08:30");
  const [subject, setSubject] = useState("");
  const [teacher, setTeacher] = useState("");
  const [room, setRoom] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignore invalid local data.
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items),
    );
  }, [items, ready]);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const dayDifference =
          DAYS.indexOf(a.day) - DAYS.indexOf(b.day);

        if (dayDifference !== 0) {
          return dayDifference;
        }

        return a.startTime.localeCompare(b.startTime);
      }),
    [items],
  );

  const grouped = useMemo(
    () =>
      DAYS.map((schoolDay) => ({
        day: schoolDay,
        items: sortedItems.filter(
          (item) => item.day === schoolDay,
        ),
      })),
    [sortedItems],
  );

  const activeDays = grouped.filter(
    (group) => group.items.length > 0,
  ).length;

  const busiestDay = grouped.reduce(
    (current, candidate) =>
      candidate.items.length > current.items.length
        ? candidate
        : current,
    grouped[0],
  );

  function addClass(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!subject.trim()) return;

    if (
      startTime &&
      endTime &&
      endTime <= startTime
    ) {
      window.alert(
        "End time must be later than start time.",
      );
      return;
    }

    const item: ScheduleItem = {
      id: crypto.randomUUID(),
      day,
      startTime,
      endTime,
      subject: subject.trim(),
      teacher: teacher.trim(),
      room: room.trim(),
    };

    setItems((current) => [...current, item]);

    setSubject("");
    setTeacher("");
    setRoom("");
  }

  function removeClass(id: string) {
    setItems((current) =>
      current.filter((item) => item.id !== id),
    );
  }

  function clearSchedule() {
    if (!items.length) return;

    const confirmed = window.confirm(
      "Delete the entire class schedule on this device?",
    );

    if (confirmed) {
      setItems([]);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            AralKit Student Tools
          </span>

          <h1>Class Schedule Maker</h1>

          <p>
            Build your weekly Monday to Friday class
            schedule, keep it saved on your device,
            and print a clean copy for school.
          </p>
        </div>

        <button
          type="button"
          className={styles.printButton}
          onClick={() => window.print()}
          disabled={!items.length}
        >
          Print Schedule
        </button>
      </section>

      <section className={styles.stats}>
        <article>
          <span>Total Classes</span>
          <strong>{items.length}</strong>
        </article>

        <article>
          <span>Active Days</span>
          <strong>{activeDays}</strong>
        </article>

        <article>
          <span>Busiest Day</span>
          <strong>
            {items.length
              ? busiestDay.day
              : "—"}
          </strong>
        </article>
      </section>

      <section className={styles.layout}>
        <form
          className={styles.formCard}
          onSubmit={addClass}
        >
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.miniLabel}>
                New Class
              </span>
              <h2>Add Subject</h2>
            </div>
          </div>

          <label>
            School Day

            <select
              value={day}
              onChange={(event) =>
                setDay(
                  event.target.value as SchoolDay,
                )
              }
            >
              {DAYS.map((schoolDay) => (
                <option key={schoolDay}>
                  {schoolDay}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.twoColumns}>
            <label>
              Start Time

              <input
                type="time"
                value={startTime}
                onChange={(event) =>
                  setStartTime(event.target.value)
                }
                required
              />
            </label>

            <label>
              End Time

              <input
                type="time"
                value={endTime}
                onChange={(event) =>
                  setEndTime(event.target.value)
                }
                required
              />
            </label>
          </div>

          <label>
            Subject

            <input
              value={subject}
              maxLength={80}
              placeholder="e.g. Mathematics"
              onChange={(event) =>
                setSubject(event.target.value)
              }
              required
            />
          </label>

          <label>
            Teacher

            <input
              value={teacher}
              maxLength={80}
              placeholder="Teacher name (optional)"
              onChange={(event) =>
                setTeacher(event.target.value)
              }
            />
          </label>

          <label>
            Room

            <input
              value={room}
              maxLength={50}
              placeholder="Room / classroom (optional)"
              onChange={(event) =>
                setRoom(event.target.value)
              }
            />
          </label>

          <button
            className={styles.primaryButton}
            type="submit"
          >
            Add to Schedule
          </button>

          <button
            className={styles.dangerButton}
            type="button"
            disabled={!items.length}
            onClick={clearSchedule}
          >
            Clear Schedule
          </button>

          <p className={styles.storageNote}>
            Your schedule is saved locally on this
            device.
          </p>
        </form>

        <section className={styles.scheduleCard}>
          <div className={styles.scheduleHeader}>
            <div>
              <span className={styles.miniLabel}>
                Weekly Schedule
              </span>
              <h2>Monday – Friday</h2>
            </div>

            <span className={styles.classCount}>
              {items.length}{" "}
              {items.length === 1
                ? "class"
                : "classes"}
            </span>
          </div>

          {!items.length ? (
            <div className={styles.emptyState}>
              <strong>No classes added yet.</strong>
              <p>
                Use the form to create your weekly
                school schedule.
              </p>
            </div>
          ) : (
            <div className={styles.days}>
              {grouped.map((group) => (
                <section
                  key={group.day}
                  className={styles.dayBlock}
                >
                  <div className={styles.dayTitle}>
                    <strong>{group.day}</strong>
                    <span>
                      {group.items.length}
                    </span>
                  </div>

                  {!group.items.length ? (
                    <div
                      className={
                        styles.noClasses
                      }
                    >
                      No classes
                    </div>
                  ) : (
                    <div
                      className={
                        styles.classList
                      }
                    >
                      {group.items.map((item) => (
                        <article
                          key={item.id}
                          className={
                            styles.classRow
                          }
                        >
                          <div
                            className={
                              styles.time
                            }
                          >
                            <strong>
                              {formatTime(
                                item.startTime,
                              )}
                            </strong>

                            <span>
                              to{" "}
                              {formatTime(
                                item.endTime,
                              )}
                            </span>
                          </div>

                          <div
                            className={
                              styles.subject
                            }
                          >
                            <strong>
                              {item.subject}
                            </strong>

                            <span>
                              {[
                                item.teacher,
                                item.room,
                              ]
                                .filter(Boolean)
                                .join(" • ") ||
                                "No additional details"}
                            </span>
                          </div>

                          <button
                            type="button"
                            className={
                              styles.deleteButton
                            }
                            aria-label={`Delete ${item.subject}`}
                            onClick={() =>
                              removeClass(
                                item.id,
                              )
                            }
                          >
                            Delete
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
