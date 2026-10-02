export type GradeRow = {
  name: string;
  grade: string;
};

export type GradeResult = {
  average: number | null;
  subjectCount: number;
  errors: string[];
  status: "empty" | "invalid" | "valid";
};

export function calculateAverage(
  rows: GradeRow[]
): GradeResult {

  const active = rows.filter(
    (row) =>
      row.name.trim() !== "" ||
      row.grade.trim() !== ""
  );

  if (active.length === 0) {
    return {
      average: null,
      subjectCount: 0,
      errors: [],
      status: "empty",
    };
  }

  const errors: string[] = [];

  let total = 0;

  active.forEach((row, index) => {

    const name = row.name.trim();

    const raw = row.grade.trim();

    const grade = Number(raw);

    if (!name) {
      errors.push(
        `Row ${index + 1}: Subject name is required.`
      );
    }

    if (
      raw === "" ||
      !Number.isFinite(grade) ||
      grade < 0 ||
      grade > 100
    ) {
      errors.push(
        `Row ${index + 1}: Grade must be between 0 and 100.`
      );
    } else {
      total += grade;
    }

  });

  if (errors.length > 0) {
    return {
      average: null,
      subjectCount: active.length,
      errors,
      status: "invalid",
    };
  }

  return {
    average: total / active.length,
    subjectCount: active.length,
    errors: [],
    status: "valid",
  };

}
