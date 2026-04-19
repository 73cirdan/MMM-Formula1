import { vi, describe, it, expect } from "vitest";
import { fetchSeasonData, fetchSchedule } from "../../jolpiApi";

describe("jolpiApi", () => {
  it("fetches season data correctly", async () => {
    const result = await fetchSeasonData("driver", "2021");

    // Now the expected value should match the response structure
    expect(result.DriverStandings[0]).toEqual({
      Constructors: [
        {
          constructorId: "red_bull",
          name: "Red Bull",
          nationality: "Austrian",
          url: "https://en.wikipedia.org/wiki/Red_Bull_Racing"
        }
      ],
      position: "1",
      Driver: {
        givenName: "Max",
        familyName: "Verstappen",
        nationality: "Dutch",
        driverId: "max_verstappen",
        code: "VER",
        dateOfBirth: "1997-09-30",
        permanentNumber: "3",
        url: "http://en.wikipedia.org/wiki/Max_Verstappen"
      },
      points: "395.5",
      positionText: "1",
      wins: "10"
    });
  });

  it("handles errors when fetching season data", async () => {
    const result = await fetchSeasonData("somewrongtest", "2021");

    expect(result).toBe(null);
  });

  it("fetches the F1 schedule correctly", async () => {
    const result = await fetchSchedule("2021");

    expect(result.length).toEqual(22);
    expect(result[0].date).toEqual("2021-03-28");
    expect(result[0].raceName).toEqual("Bahrain Grand Prix");
  });

  it("prints error and return null when no usable schedule data is found", async () => {
    const result = await fetchSchedule("21");
    expect(result).toBe(null);
  });
});
