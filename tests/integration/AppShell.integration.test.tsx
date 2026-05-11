import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";

import App from "@/App";

describe("App shell integration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows configuration guidance when Stadia API key is missing", async () => {
    vi.stubEnv("VITE_STADIA_API_KEY", "");

    render(<App />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.getByRole("heading", {
        name: "Map configuration required",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/VITE_STADIA_API_KEY is not set/i)
    ).toBeInTheDocument();
  });
});
