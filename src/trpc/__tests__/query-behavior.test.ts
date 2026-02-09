import { describe, expect, it } from "bun:test";

import {
  shouldLogTrpcOperation,
  shouldRetryQueryError,
} from "../query-behavior";

describe("query behavior", () => {
  it("does not retry aborted requests", () => {
    const shouldRetry = shouldRetryQueryError(0, new DOMException("Aborted", "AbortError"));

    expect(shouldRetry).toBe(false);
  });

  it("retries retryable errors only once", () => {
    expect(shouldRetryQueryError(0, new Error("network timeout"))).toBe(true);
    expect(shouldRetryQueryError(1, new Error("network timeout"))).toBe(false);
  });

  it("allows disabling retries via max retry attempts", () => {
    expect(shouldRetryQueryError(0, new Error("network timeout"), 0)).toBe(false);
  });

  it("avoids logging expected abort noise", () => {
    expect(
      shouldLogTrpcOperation({
        direction: "down",
        result: new DOMException("Aborted", "AbortError"),
      }),
    ).toBe(false);
  });

  it("logs downlink errors that are actionable", () => {
    expect(
      shouldLogTrpcOperation({
        direction: "down",
        result: new Error("Internal Server Error"),
      }),
    ).toBe(true);
  });

  it("does not log uplink traffic by default", () => {
    expect(
      shouldLogTrpcOperation({
        direction: "up",
      }),
    ).toBe(false);
  });
});
