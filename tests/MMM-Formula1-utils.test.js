// tests/MMM-Formula1-utils.test.js
import { vi, describe, it, expect } from "vitest";

// Declare the MMMFormula1Utils variable to load UMD module dynamically
let MMMFormula1Utils;

if (typeof module !== "undefined" && module.exports) {
  // In Node.js, use `require` to load the UMD module
  MMMFormula1Utils = require("../MMM-Formula1-utils.js");
} else {
  // In the browser, use the global variable `MMMFormula1Utils`
  MMMFormula1Utils = window.MMMFormula1Utils;
}

describe("processStandingsWithFanData", () => {
  const standings = [
    { position: 1, Driver: { code: "VER" } },
    { position: 2, Driver: { code: "HAM" } },
    { position: 6, Driver: { code: "LEC" } },
    { position: 7, Driver: { code: "RIC" } }
  ];

  it("should process driver standings correctly with valid fan code", () => {
    const config = {
      fanDriverCode: "LEC",
      maxRowsDriver: 2
    };

    const result = MMMFormula1Utils.processStandingsWithFanData(
      { DriverStandings: standings },
      "DriverStandings",
      config
    );

    expect(result.DriverStandings.length).toBe(3); // Expecting 3 (2 + 1)
    expect(result.DriverStandings[2].Driver.code).toBe("LEC");
  });

  it("should process driver standings correctly with invalid fan code", () => {
    const config = {
      fanDriverCode: "MAG", // Code for a non-existing driver
      maxRowsDriver: 2
    };

    const result = MMMFormula1Utils.processStandingsWithFanData(
      { DriverStandings: standings },
      "DriverStandings",
      config
    );

    expect(result.DriverStandings.length).toBe(2); // Only 2 drivers should be returned
  });

  it("should handle case with empty standings array", () => {
    const config = {
      fanDriverCode: "LEC",
      maxRowsDriver: 2
    };

    const result = MMMFormula1Utils.processStandingsWithFanData(
      { DriverStandings: [] },
      "DriverStandings",
      config
    );

    expect(result.DriverStandings.length).toBe(0); // No drivers in standings
  });

  it("should process constructor standings correctly", () => {
    const standings = [
      { position: 1, Constructor: { constructorId: "red_bull" } },
      { position: 2, Constructor: { constructorId: "ferrari" } },
      { position: 6, Constructor: { constructorId: "mercedes" } }
    ];
    const config = {
      fanConstructorCode: "ferrari",
      maxRowsConstructor: 2
    };

    const result = MMMFormula1Utils.processStandingsWithFanData(
      { ConstructorStandings: standings },
      "ConstructorStandings",
      config
    );

    expect(result.ConstructorStandings.length).toBe(2); // Expecting 2
    expect(result.ConstructorStandings[1].Constructor.constructorId).toBe("ferrari");
  });
});

describe("processScheduleForNextRace", () => {
  it("should return the next race after today", () => {
    const schedule = [
      { raceName: "Australian GP", date: "1026-03-20", round: "1" },
      {
        raceName: "Bahrain Grand Prix",
        date: "3021-03-28",
        round: "2",
        season: "2021",
        Circuit: {
          circuitId: "bahrain",
          circuitName: "Bahrain International Circuit"
        },
        time: "15:00:00Z",
        FirstPractice: {
          date: "3021-03-26"
        },
        SecondPractice: {
          date: "3021-03-26"
        },
        ThirdPractice: {
          date: "3021-03-27"
        },
        Qualifying: {
          date: "3021-03-27"
        }
      },
      {
        raceName: "Emilia Romagna Grand Prix",
        date: "3021-04-18",
        round: "3",
        season: "2021",
        Circuit: {
          circuitId: "imola",
          circuitName: "Autodromo Enzo e Dino Ferrari"
        },
        time: "13:00:00Z",
        FirstPractice: {
          date: "3021-04-16"
        },
        SecondPractice: {
          date: "3021-04-16"
        },
        ThirdPractice: {
          date: "3021-04-17"
        },
        Qualifying: {
          date: "3021-04-17"
        }
      }
    ];
    const circuitImages = {};
    const result = MMMFormula1Utils.processScheduleForNextRace(schedule, circuitImages);
    expect(result.circuitName).toBe("Bahrain International Circuit");
    expect(result.nextRaceName).toBe("Emilia Romagna Grand Prix");
    expect(result.round).toBe("2");
    expect(result.raceName).toBe("Bahrain Grand Prix");
  });

  it("should return null if no next race is found", () => {
    const schedule = [{ raceName: "Australian GP", date: "2026-03-20" }];
    const result = MMMFormula1Utils.processScheduleForNextRace(schedule, {});
    expect(result).toBeNull();
  });
});

describe("getCodeFromNationality", () => {
  const nationalityMap = {
    British: "GB",
    German: "DE",
    French: "FR"
  };

  it("should return the correct code for British nationality", () => {
    const result = MMMFormula1Utils.getCodeFromNationality(nationalityMap, "British");
    expect(result).toBe("GB");
  });

  it("should return the correct code for French nationality", () => {
    const result = MMMFormula1Utils.getCodeFromNationality(nationalityMap, "French");
    expect(result).toBe("FR");
  });

  it("should return an empty string for an unknown nationality", () => {
    const result = MMMFormula1Utils.getCodeFromNationality(nationalityMap, "Italian");
    expect(result).toBe("");
  });
});

describe("processDriverProfiles", () => {
  it("should add a new driver profile if it does not exist", () => {
    const existingProfiles = [];
    const newProfile = {
      Driver: {
        driverId: "hamilton",
        name: "Lewis Hamilton",
        nationality: "British",
        dateOfBirth: "1985-01-07"
      },
      openF1: { team_colour: "FF0000", driver_number: "44", headshot_url: "hamilton.jpg" },
      careerHighlights: { total_race_wins: 7, total_podiums: 98 }
    };

    const result = MMMFormula1Utils.processDriverProfiles(existingProfiles, newProfile);
    expect(result.length).toBe(1);
    expect(result[0].driverId).toBe("hamilton");
  });

  it("should not add a profile if it already exists", () => {
    const existingProfiles = [{ driverId: "hamilton", name: "Lewis Hamilton" }];
    const newProfile = { Driver: { driverId: "hamilton", name: "Lewis Hamilton" } };

    const result = MMMFormula1Utils.processDriverProfiles(existingProfiles, newProfile);
    expect(result.length).toBe(1); // Profile should not be added again
  });
});

describe("findBirthdayDrivers", () => {
  it("should return drivers with birthday today", () => {
    const today = new Date().toISOString().split("T")[0];
    const standings = {
      DriverStandings: [
        {
          Driver: { permanentNumber: "44", dateOfBirth: `${today}`, code: "HAM" }
        },
        {
          Driver: { permanentNumber: "33", dateOfBirth: "1995-09-30", code: "PIA" }
        }
      ]
    };

    const result = MMMFormula1Utils.findBirthdayDrivers(standings);
    expect(result.length).toBe(1); // Assuming HAM has a birthday today
  });

  it("should return empty list if no birthdays today", () => {
    const standings = {
      DriverStandings: [
        {
          Driver: { permanentNumber: "44", dateOfBirth: "1985-01-07", code: "HAM" }
        }
      ]
    };

    const result = MMMFormula1Utils.findBirthdayDrivers(standings);
    expect(result.length).toBe(0);
  });
});

describe("shouldShowStanding", () => {
  it("shows DRIVER in the first half of the minute when MIX", () => {
    const result = MMMFormula1Utils.shouldShowStanding("MIX", "DRIVER", 10);
    expect(result).toBe(true);
  });

  it("hides CONSTRUCTOR in the first half of the minute when MIX", () => {
    const result = MMMFormula1Utils.shouldShowStanding("MIX", "CONSTRUCTOR", 10);
    expect(result).toBe(false);
  });

  it("shows CONSTRUCTOR in the second half of the minute when MIX", () => {
    const result = MMMFormula1Utils.shouldShowStanding("MIX", "CONSTRUCTOR", 50);
    expect(result).toBe(true);
  });

  it("should show DRIVER when config matches type", () => {
    const result = MMMFormula1Utils.shouldShowStanding("DRIVER", "DRIVER", 10);
    expect(result).toBe(true);
  });

  it("should return false when config does not match type", () => {
    const result = MMMFormula1Utils.shouldShowStanding("DRIVER", "CONSTRUCTOR", 10);
    expect(result).toBe(false);
  });

  it("should toggle correctly at 30 seconds in MIX mode", () => {
    const result = MMMFormula1Utils.shouldShowStanding("MIX", "DRIVER", 30);
    expect(result).toBe(false); // because it's the second half
  });
});

describe("loadNationalities mock data", () => {
  it("should return an empty map when fetch fails", async () => {
    // Mock the fetch function to simulate a failed fetch
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false, // Simulating a failed fetch response
      statusText: "Network Error"
    });

    const result = await MMMFormula1Utils.loadNationalities("mockFile.json");

    // Expect the function to return an empty map on failure
    expect(result).toEqual({});

    // Optionally, verify if fetch was called with the correct argument
    expect(fetch).toHaveBeenCalledWith("mockFile.json");

    // Clean up the mock after the test
    fetch.mockRestore();
  });

  it("should handle errors during fetch", async () => {
    // Mock the fetch function to simulate a thrown error
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Failed to fetch mockFile.json"));

    const result = await MMMFormula1Utils.loadNationalities("mockFile.json");

    // Expect the function to return an empty map when an error is thrown
    expect(result).toEqual({});

    // Optionally, verify if fetch was called with the correct argument
    expect(fetch).toHaveBeenCalledWith("mockFile.json");

    // Clean up the mock after the test
    fetch.mockRestore();
  });

  it("should return map when fetch is successful", async () => {
    // Mock the fetch function to simulate a successful fetch
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true, // Simulating a successful fetch response
      json: vi.fn().mockResolvedValueOnce([
        { demonym: "American", code: "US" },
        { demonym: "French", code: "FR" }
      ])
    });

    const result = await MMMFormula1Utils.loadNationalities("mockFile.json");

    // Expect the function to return a correctly processed map
    expect(result).toEqual({
      American: "us",
      French: "fr"
    });

    // Optionally, verify if fetch was called with the correct argument
    expect(fetch).toHaveBeenCalledWith("mockFile.json");

    // Clean up the mock after the test
    fetch.mockRestore();
  });
});
