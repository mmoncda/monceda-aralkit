import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | AralKit PH",
  description:
    "Learn about AralKit PH, a free educational toolkit.",
};

export default function AboutPage() {
  return (
    <section className="tool-page">
      <span className="pill">
        About AralKit PH
      </span>

      <h1>Learning made easier.</h1>

      <p>
        AralKit PH is a collection of free
        learning tools developed by Monceda Labs.
      </p>

      <p>
        Our goal is to make everyday school
        activities easier for Filipino students,
        parents, and teachers.
      </p>

      <div className="calculator">
        <h2 className="text-xl font-bold">
          What you can do
        </h2>

        <ul className="info-list">
          <li>Calculate your grades.</li>
          <li>Practice entrance exam questions.</li>
          <li>Generate math worksheets.</li>
          <li>Create school project covers.</li>
        </ul>
      </div>

      <p>
        AralKit PH is an independent
        educational project. Its practice
        questions are not official entrance
        examination materials.
      </p>

      <Link
        className="primary-button"
        href="/"
      >
        Explore School Tools
      </Link>
    </section>
  );
}
