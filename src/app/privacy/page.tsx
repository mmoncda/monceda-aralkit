import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | AralKit PH",
  description:
    "Privacy information for AralKit PH.",
};

export default function PrivacyPage() {
  return (
    <section className="tool-page">

      <span className="pill">
        Privacy
      </span>

      <h1>Privacy Policy</h1>

      <p>
        Last updated: September 21, 2026
      </p>

      <p>
        AralKit PH is an educational
        toolkit developed by Monceda Labs.
      </p>

      <div className="calculator">

        <h2 className="text-xl font-bold">
          Information entered into tools
        </h2>

        <p>
          The current Grade Calculator,
          Entrance Reviewer, Math Worksheet
          Generator, and School Cover Maker
          process their inputs in your browser.
        </p>

        <p>
          AralKit PH does not currently
          provide user accounts or a
          cloud-saved student progress feature.
        </p>

        <p>
          You do not need to submit your
          real name to use the educational
          practice tools.
        </p>

        <h2 className="mt-8 text-xl font-bold">
          Website hosting
        </h2>

        <p>
          When you visit the published
          website, the hosting provider
          may process technical information
          such as IP addresses, requests,
          and security logs.
        </p>

        <h2 className="mt-8 text-xl font-bold">
          Third-party services
        </h2>

        <p>
          If analytics, advertising,
          external services, or account
          features are added in the future,
          this policy will need to be
          updated to describe their
          applicable data practices.
        </p>

        <h2 className="mt-8 text-xl font-bold">
          Questions
        </h2>

        <p>
          Visit Monceda Labs for developer
          information and future
          contact updates.
        </p>

        <a
          href="https://moncedalabs.com/"
          className="primary-button"
        >
          Visit Monceda Labs
        </a>

      </div>

    </section>
  );
}
