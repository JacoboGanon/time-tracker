type ResolveRateInput = {
  defaultRateCents: number | null;
  projectOverrideRateCents: number | null;
};

type CalculateAmountInput = {
  durationMinutes: number;
  hourlyRateCents: number;
  isBillable: boolean;
};

export const resolveHourlyRateCents = ({
  defaultRateCents,
  projectOverrideRateCents,
}: ResolveRateInput): number | null => {
  if (projectOverrideRateCents !== null) {
    return projectOverrideRateCents;
  }

  return defaultRateCents;
};

export const calculateEntryAmountCents = ({
  durationMinutes,
  hourlyRateCents,
  isBillable,
}: CalculateAmountInput): number => {
  if (!isBillable) {
    return 0;
  }

  return Math.round((durationMinutes / 60) * hourlyRateCents);
};
