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

describe("sliceStandings", () => {
  it("should return the full standings if maxRows is larger than the standings length", () => {
    const standings = [{ position: 1 }, { position: 2 }];
    const result = MMMFormula1Utils.sliceStandings(standings, 3, null);
    expect(result).toEqual(standings);
  });

  it("should slice the standings to maxRows", () => {
    const standings = [{ position: 1 }, { position: 2 }, { position: 3 }];
    const result = MMMFormula1Utils.sliceStandings(standings, 2, null);
    expect(result.length).toBe(2);
  });

  it("should add fan position if needed", () => {
    const standings = [{ position: 1 }, { position: 2 }];
    const fanPosition = { position: 3, Driver: { code: "LEC" } };
    const result = MMMFormula1Utils.sliceStandings(standings, 2, fanPosition);
    expect(result.length).toBe(3); // includes the fanPosition
    expect(result[2].Driver.code).toBe("LEC");
  });

  it("should return empty array if standings are empty", () => {
    const standings = [];
    const result = MMMFormula1Utils.sliceStandings(standings, 2, null);
    expect(result).toEqual([]);
  });

  it("should return empty array if maxRows is zero", () => {
    const standings = [{ position: 1 }];
    const result = MMMFormula1Utils.sliceStandings(standings, 0, null);
    expect(result).toEqual([]);
  });
});

describe("MMMFormula1Utils Functions", () => {
  // Test for formatDateAndTime function
  it("should format date and time correctly in 24-hour format", () => {
    const dateTime = { date: "2026-03-22", time: "12:30" };
    const formatted = MMMFormula1Utils.formatDateAndTime(dateTime, 24, "en");
    expect(formatted).toBe("Mar 22, 12:30");
  });

  // Test for formatDateAndTime function in nl locale
  it("should format date and time correctly in 24-hour format", () => {
    const dateTime = { date: "2026-03-22", time: "12:30" };
    const formatted = MMMFormula1Utils.formatDateAndTime(dateTime, 24, "nl");
    expect(formatted).toBe("22 mrt, 12:30");
  });

  it("should format date and time correctly in 12-hour format", () => {
    const dateTime = { date: "2026-03-22", time: "12:30" };
    const formatted = MMMFormula1Utils.formatDateAndTime(dateTime, 12, "en");
    expect(formatted).toBe("Mar 22, 12:30 PM");
  });

  it("should return only date if time is missing", () => {
    const dateTime = { date: "2026-03-22" };
    const formatted = MMMFormula1Utils.formatDateAndTime(dateTime, 24);
    expect(formatted).toBe('Mar 22 <i class="small fa fa-hourglass"></i>');
  });

  it("should return null if date is missing", () => {
    const dateTime = {};
    const formatted = MMMFormula1Utils.formatDateAndTime(dateTime, 24);
    expect(formatted).toBeNull();
  });

  // Test for findNextRound function
  it("should find the next race round correctly", () => {
    const dates = [
      { date: "2026-03-22", round: 1 },
      { date: "2026-03-28", round: 2 }
    ];
    const yesterday = "2026-03-21";
    const nextRound = MMMFormula1Utils.findNextRound(dates, yesterday);
    expect(nextRound).toBe(1); // should return the first round
  });

  it("should return null if no upcoming round is found", () => {
    const dates = [
      { date: "2026-03-22", round: 1 },
      { date: "2026-03-28", round: 2 }
    ];
    const yesterday = "2026-03-29"; // no rounds after this date
    const nextRound = MMMFormula1Utils.findNextRound(dates, yesterday);
    expect(nextRound).toBeNull(); // no round should be found
  });
});

describe("findFan function", () => {
  it("finds fan driver correctly", () => {
    const standings = [{ Driver: { code: "VER" } }, { Driver: { code: "LEC" } }];

    // Call findFan with `findFanFn` set to true (for drivers)
    expect(MMMFormula1Utils.findFan(standings, true, "lec")).toEqual({
      Driver: { code: "LEC" }
    });

    // If no driver is found
    expect(MMMFormula1Utils.findFan(standings, true, "HAM")).toBeNull();
  });

  it("finds fan constructor correctly", () => {
    const standings = [
      { Constructor: { constructorId: "red_bull" } },
      { Constructor: { constructorId: "ferrari" } }
    ];

    // Call findFan with `findFanFn` set to false (for constructors)
    expect(MMMFormula1Utils.findFan(standings, false, "RED_BULL")).toEqual({
      Constructor: { constructorId: "red_bull" }
    });

    // If no constructor is found
    expect(MMMFormula1Utils.findFan(standings, false, "MERC")).toBeNull();
  });
});

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
      "Driver",
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
      "Driver",
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
      "Driver",
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
      "Constructor",
      config
    );

    expect(result.ConstructorStandings.length).toBe(2); // Expecting 2
    expect(result.ConstructorStandings[1].Constructor.constructorId).toBe("ferrari");
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
