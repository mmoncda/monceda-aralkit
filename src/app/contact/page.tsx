import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | AralKit PH",
  description:
    "Contact information for AralKit PH.",
};

export default function ContactPage() {
  return (
    <section className="tool-page">
      <span className="pill">
        Contact
      </span>

      <h1>Get in touch.</h1>

      <p>
        AralKit PH is developed by
        Monceda Labs.
      </p>

      <div className="calculator">
        <h2 className="text-xl font-bold">
          Questions or suggestions?
        </h2>

        <p>
          Visit the Monceda Labs website
          for information about the developer.
        </p>

        <a
          className="primary-button"
          href="https://moncedalabs.com/"
        >
          Visit Monceda Labs
        </a>

        <p className="note">
          No contact form is currently
          enabled on AralKit PH.
        </p>
      </div>

      <Link
        className="secondary-button"
        href="/"
      >
        Back to Home
      </Link>
    </section>
  );
}
