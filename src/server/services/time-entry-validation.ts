export type TimeRange = {
  startAt: Date;
  endAt: Date;
};

type ValidateInput = {
  startAt: Date;
  endAt: Date;
};

type OverlapInput = {
  candidate: TimeRange;
  existingRanges: TimeRange[];
};

const assertValidDate = (value: Date, fieldName: string): void => {
  if (Number.isNaN(value.getTime())) {
    throw new Error(`${fieldName} must be a valid date`);
  }
};

export const validateTimeEntryInput = ({
  startAt,
  endAt,
}: ValidateInput): { durationMinutes: number } => {
  assertValidDate(startAt, "startAt");
  assertValidDate(endAt, "endAt");

  const durationMs = endAt.getTime() - startAt.getTime();
  const durationMinutes = Math.round(durationMs / 60_000);

  if (durationMinutes <= 0) {
    throw new Error("endAt must be after startAt");
  }

  return { durationMinutes };
};

export const ensureNoOverlaps = ({
  candidate,
  existingRanges,
}: OverlapInput): void => {
  const hasOverlap = existingRanges.some(
    (range) =>
      candidate.startAt.getTime() < range.endAt.getTime() &&
      candidate.endAt.getTime() > range.startAt.getTime(),
  );

  if (hasOverlap) {
    throw new Error("Time entry overlaps with an existing entry");
  }
};
