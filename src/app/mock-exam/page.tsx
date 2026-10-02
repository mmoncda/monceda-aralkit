import type { Metadata } from "next";
import MockExam from "./mock-exam";

export const metadata: Metadata = {
  title: "Grade 7 Mock Exam | AralKit PH",
  description:
    "An original 40-question, 60-minute Grade 7 practice exam with four subjects and answer explanations.",
  alternates: {
    canonical: "/mock-exam/",
  },
};

export default function MockExamPage() {
  return <MockExam />;
}
