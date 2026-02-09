const getMaxRetryAttempts = (): number =>
  process.env.NODE_ENV === "development" ? 0 : 1;

const ABORT_ERROR_NAMES = new Set(["AbortError", "CanceledError"]);

const hasAbortLikeName = (name: string | undefined): boolean =>
  typeof name === "string" && ABORT_ERROR_NAMES.has(name);

const hasAbortLikeMessage = (message: string | undefined): boolean =>
  typeof message === "string" &&
  (message.includes("AbortError") ||
    message.includes("aborted") ||
    message.includes("cancelled") ||
    message.includes("canceled"));

export const isAbortLikeError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  if (hasAbortLikeName(error.name) || hasAbortLikeMessage(error.message)) {
    return true;
  }

  const errorLike = error as {
    cause?: { name?: string; message?: string };
  };

  return (
    hasAbortLikeName(errorLike.cause?.name) ||
    hasAbortLikeMessage(errorLike.cause?.message)
  );
};

export const shouldRetryQueryError = (
  failureCount: number,
  error: unknown,
  maxRetryAttempts = getMaxRetryAttempts(),
): boolean => {
  if (isAbortLikeError(error)) {
    return false;
  }

  return failureCount < maxRetryAttempts;
};

type TrpcLogDirection = "up" | "down";

export const shouldLogTrpcOperation = (params: {
  direction: TrpcLogDirection;
  result?: unknown;
}): boolean => {
  const { direction, result } = params;

  if (direction === "up") {
    return false;
  }

  if (result instanceof Error) {
    return !isAbortLikeError(result);
  }

  return false;
};
