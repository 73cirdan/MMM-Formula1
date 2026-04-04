// MMM-Formula1-utils.js
// Universal Module Definition (UMD) style, both browser (run) and module (test)
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    // Node.js / CommonJS environment
    module.exports = factory(require("moment")); // `moment` for Node.js
  } else {
    // Browser environment (global variable)
    root.MMMFormula1Utils = factory(moment); // `moment` for the browser
  }
})(typeof self !== "undefined" ? self : this, function (moment) {
  /*
   * Helper Functions (General Utility)
   */

  // Only leave the top n positions and add the fan's position if needed.
  function sliceStandings(standings, maxRows, fanPosition) {
    if (!standings?.length || !maxRows) return [];

    // Slice the standings if necessary to limit to maxRows
    let sliced = standings.slice(0, maxRows);

    // If fanPosition is beyond maxRows, add the fan's position at the end
    if (fanPosition?.position > maxRows) {
      sliced = [...sliced, fanPosition];
    }

    return sliced;
  }

  // Formats the given date and time.
  function formatDateAndTime(dateTime, timeFormat) {
    if (!dateTime || !dateTime.date) return null;

    const dateStr = moment(dateTime.date).format("DD MMM");

    if (!dateTime.time) {
      return `${dateStr} <i class="small fa fa-hourglass"></i>`; // Return date with hourglass if no time
    }

    const dateTimeMoment = moment(dateTime.date + "T" + dateTime.time);

    // Return date and time in either 24-hour or 12-hour format based on `timeFormat`
    return timeFormat === 24
      ? dateTimeMoment.format("DD MMM HH:mm")
      : dateTimeMoment.format("DD MMM hh:mm A");
  }

  // Finds the fan's driver position or constructor position from standings based on `isDriver`
  function findFan(standings, isDriver, fanCode) {
    if (!fanCode) return null;

    fanCode = String(fanCode); // Ensure fanCode is a string

    // Search for the fan's position in the standings
    if (isDriver) {
      const driver = standings.find((s) => s.Driver?.code.toUpperCase() === fanCode.toUpperCase());
      return driver || null;
    } else {
      const constructor = standings.find(
        (s) => s.Constructor?.constructorId.toLowerCase() === fanCode.toLowerCase()
      );
      return constructor || null;
    }
  }

  // Determines if a particular standing should be displayed based on configuration.
  function shouldShowStanding(configType, showType, currentSecond) {
    const validTypes = ["DRIVER", "CONSTRUCTOR"];

    if (configType === "MIX") {
      const isFirstHalf = 60 - currentSecond > 30; // First half of the race (60 seconds - currentSecond)
      return showType === "DRIVER" ? isFirstHalf : !isFirstHalf; // Show DRIVER or CONSTRUCTOR based on timing
    }

    return validTypes.includes(configType) && configType === showType;
  }

  // Function to lookup the code for a given nationality from a map
  function getCodeFromNationality(nationalityMap, nationality) {
    return nationalityMap[nationality] || ""; // Return code or empty string if not found
  }

  /*
   * Core Data Processing Functions
   */

  // Processes the standings (drivers/constructors) and adds fan-specific data.
  // It slices the standings or adds the fan's position if needed.
  function processStandingsWithFanData(payload, type, config) {
    const key = type + "Standings"; // "DriverStandings" or "ConstructorStandings"

    if (!payload?.[key]) return payload; // If no standings, return the original payload

    // Determine if we're processing drivers or constructors
    const isDriver = type === "Driver";

    const fanCode = isDriver ? config.fanDriverCode : config.fanConstructorCode;
    const maxRows = isDriver ? config.maxRowsDriver : config.maxRowsConstructor;

    // Find the fan's position in the standings
    const fanPosition = findFan(payload[key], isDriver, fanCode);

    // Slice standings based on maxRows and fanPosition
    const slicedStandings = sliceStandings(payload[key], maxRows, fanPosition);

    // Return the modified payload with updated standings
    return {
      ...payload,
      [key]: slicedStandings
    };
  }

  // Prepares the schedule data specifically for the next race.
  // Determines the current race and the next race based on yesterday's date.
  function processScheduleForNextRace(schedule, circuitImages) {
    const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");
    const currentround = findNextRound(schedule, yesterday);

    let templateScheduleData = null;

    // If no races are scheduled, don't display anything
    if (currentround) {
      templateScheduleData = processScheduleForDisplay(schedule, currentround, circuitImages);
    }

    return templateScheduleData;
  }

  // Formats and processes the schedule data for display purposes.
  function processScheduleForDisplay(schedule, currentround, circuitImages) {
    const currentRace = schedule[currentround - 1]; // Current race
    const nextRace = schedule[currentround]; // Next race

    return {
      season: schedule[0].season, // Season year
      round: currentround, // Race round number
      raceName: currentRace.raceName, // Race name
      circuitImage: circuitImages[currentRace.Circuit.circuitId], // Circuit image
      circuitName: currentRace.Circuit.circuitName, // Circuit name
      raceDate: formatDateAndTime(currentRace), // Race date formatted
      qualifyingDate: formatDateAndTime(currentRace.Qualifying), // Qualifying date formatted
      pract1Date: formatDateAndTime(currentRace.FirstPractice), // First practice session date
      pract2Date: formatDateAndTime(currentRace.SecondPractice), // Second practice session date
      pract3Date: formatDateAndTime(currentRace.ThirdPractice), // Third practice session date
      sprintQualifyingDate: formatDateAndTime(currentRace.SprintQualifying), // Sprint qualifying date
      sprintDate: formatDateAndTime(currentRace.Sprint), // Sprint race date
      nextRaceDate: nextRace ? formatDateAndTime(nextRace) : null, // Next race date
      nextRaceName: nextRace ? nextRace.raceName : null // Next race name
    };
  }

  // Finds the next race round by comparing the race date with yesterday's date.
  function findNextRound(dates, yesterday) {
    let i = 0;
    let round = null;

    while (!round && i < dates.length) {
      let aDate = moment(dates[i].date, "YYYY-MM-DD", true);
      if (aDate.isAfter(yesterday)) {
        round = dates[i].round;
      }
      i++;
    }

    return round;
  }

  /*
   * Async methods
   */

  // Utility to load nationalities and return them in a map.
  // It fetches the nationality data from a given file and constructs a lookup map.
  async function loadNationalities(file) {
    try {
      const response = await fetch(file);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
      }

      const data = await response.json(); // Parse the JSON response

      // Build a map for quick lookup of nationality code by demonym
      const nationalitiesMap = {}; // Changed from 'nationalities' to 'nationalitiesMap'
      for (const entry of data) {
        nationalitiesMap[entry.demonym] = entry.code.toLowerCase(); // Map demonym to country code
      }

      return nationalitiesMap; // Return the map directly
    } catch (error) {
      console.error("Error loading nationalities:", error);
      return {}; // Return an empty map if there's an error
    }
  }

  /*
   * Export to outside, browser and/or vitest
   */

  // Create a utility object for better organization.
  const MMMFormula1Utils = {
    // General Utility Functions
    sliceStandings,
    formatDateAndTime,
    shouldShowStanding,
    getCodeFromNationality,
    findFan,
    findNextRound,

    // Data Processing Functions
    processStandingsWithFanData,
    processScheduleForDisplay,
    processScheduleForNextRace,

    // Async Methods
    loadNationalities
  };

  return MMMFormula1Utils;
});
