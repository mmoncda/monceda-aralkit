export const COVER_TEMPLATES = [
  {
    id: "classic",
    name: "Classic Academic",
  },
  {
    id: "modern",
    name: "Modern Blue",
  },
  {
    id: "minimal",
    name: "Minimal Clean",
  },
] as const;

export type CoverTemplate =
  (typeof COVER_TEMPLATES)[number]["id"];

export type CoverFields = {
  title: string;
  student: string;
  gradeSection: string;
  subject: string;
  teacher: string;
  school: string;
  date: string;
};

export function formatCoverDate(
  value: string
): string {
  if (!value) return "";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
    value
  );

  if (!match) return "";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const parsed = new Date(
    `${value}T00:00:00.000Z`
  );

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(parsed);
}

export function normalizeCover(
  fields: CoverFields
) {
  return {
    title:
      fields.title.trim() ||
      "School Project",

    student:
      fields.student.trim() ||
      "Student Name",

    gradeSection:
      fields.gradeSection.trim() ||
      "Grade & Section",

    subject:
      fields.subject.trim() ||
      "Subject",

    teacher:
      fields.teacher.trim(),

    school:
      fields.school.trim() ||
      "School Name",

    date: formatCoverDate(
      fields.date.trim()
    ),
  };
}
