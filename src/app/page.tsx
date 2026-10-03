import Link from "next/link";

const tools = [
  {
    icon: "🧮",
    name: "Grade Calculator",
    description: "Calculate your general average.",
    href: "/tools/grade-calculator/",
    status: "Available",
  },
  {
    icon: "📚",
    name: "Entrance Reviewer",
    description: "Prepare for Grade 7 admissions.",
    href: "/reviewer/",
    status: "Available",
  },
  {
    icon: "📝",
    name: "Worksheet Generator",
    description: "Printable mathematics activities.",
    href: "/tools/worksheet-generator/",
    status: "Available",
  },
  {
    icon: "🎨",
    name: "School Cover Maker",
    description: "Create printable project covers.",
    href: "/tools/cover-maker/",
    status: "Available",
  },
  {
    icon: "🏆",
    name: "Student Performance",
    description: "Track grades, averages, and student rankings.",
    href: "/performance/",
    status: "New",
  },
  {
    icon: "📅",
    name: "Attendance Tracker",
    description: "Track present, absent, and late records.",
    href: "/attendance/",
    status: "New",
  },
  {
    icon: "🗓️",
    name: "Class Schedule Maker",
    description: "Build and print your weekly class schedule.",
    href: "/schedule/",
    status: "New",
  },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <span className="pill">
          Free School Tools for Filipinos
        </span>

        <h1>Learn. Practice. Achieve.</h1>

        <p>
          Simple and useful learning tools for
          Filipino students, parents, and teachers.
        </p>

        <Link
          className="primary-button"
          href="/tools/grade-calculator/"
        >
          Try Grade Calculator →
        </Link>
      </section>

      <section>
        <h2 className="section-title">
          Explore AralKit
        </h2>

        <div className="tool-grid">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="tool-card"
            >
              <span className="tool-icon">
                {tool.icon}
              </span>

              <h3>{tool.name}</h3>
              <p>{tool.description}</p>

              <span className="status">
                {tool.status}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
