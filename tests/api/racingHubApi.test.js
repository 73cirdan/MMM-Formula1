import { vi, describe, it, expect } from "vitest";
import { fetchSeasonDrivers, fetchDriverCareerHighlights } from "../../racingHubApi";

describe("racingHubApi", () => {
  it("fetches season drivers correctly", async () => {
    const result = await fetchSeasonDrivers("2021");

    expect(result.length).toEqual(21);
  });

  it("handles errors when fetching season drivers", async () => {
    const result = await fetchSeasonDrivers("21");

    expect(result).toBe(null);
  });

  it("fetches driver career highlights correctly", async () => {
    const result = await fetchDriverCareerHighlights("lewis-hamilton");

    expect(result.abbreviation).toEqual("HAM");
    expect(result.best_championship_position).toEqual(1);
    expect(result.full_name).toEqual("Lewis Carl Davidson Hamilton");
    expect(result.place_of_birth).toEqual("Stevenage");
  });

  it("handles errors when fetching driver career highlights", async () => {
    const result = await fetchDriverCareerHighlights("hamilton");

    expect(result).toBe(null);
  });
});
