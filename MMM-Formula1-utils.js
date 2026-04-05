/*
 * MagicMirror²
 * Module: MMM-Formula1-utils.js
 *
 * By Cirdan, Ian Perrin http://github.com/ianperrin/MMM-Formula1
 * MIT Licensed.
 */

/* ---------------- Helper Functions ---------------- */

// Only leave the top n positions and add the fan's position if needed.
function sliceStandings(standings, maxRows, fanPosition) {
  if (!standings?.length || !maxRows) return [];
  let sliced = standings.slice(0, maxRows);
  if (fanPosition?.position > maxRows) {
    sliced = [...sliced, fanPosition];
  }
  return sliced;
}

// Formats the given date and time.
function formatDateAndTime(dateTime, timeFormat = 24, locale = "en") {
  if (!dateTime?.date) return null;

  const date = new Date(dateTime.date + (dateTime.time ? "T" + dateTime.time : ""));

  const dateStr = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(date);

  if (!dateTime.time) {
    return `${dateStr} <i class="small fa fa-hourglass"></i>`;
  }

  const options = {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: timeFormat !== 24
  };

  return new Intl.DateTimeFormat(locale, options).format(date);
}

// Finds the fan's driver position or constructor position from standings based on `isDriver`
function findFan(standings, isDriver, fanCode) {
  if (!fanCode) return null;
  fanCode = String(fanCode);

  if (isDriver) {
    return standings.find((s) => s.Driver?.code.toUpperCase() === fanCode.toUpperCase()) || null;
  } else {
    return (
      standings.find((s) => s.Constructor?.constructorId.toLowerCase() === fanCode.toLowerCase()) ||
      null
    );
  }
}
// Determines if a particular standing should be displayed based on configuration.
function shouldShowStanding(configType, showType, currentSecond) {
  const validTypes = ["DRIVER", "CONSTRUCTOR"];
  if (configType === "MIX") {
    const isFirstHalf = 60 - currentSecond > 30;
    return showType === "DRIVER" ? isFirstHalf : !isFirstHalf;
  }
  return validTypes.includes(configType) && configType === showType;
}

// Function to lookup the code for a given nationality from a map
function getCodeFromNationality(nationalityMap, nationality) {
  return nationalityMap[nationality] || "";
}

/* ---------------- Core Data Processing ---------------- */

// Processes the standings (drivers/constructors) and adds fan-specific data.
// It slices the standings or adds the fan's position if needed.
function processStandingsWithFanData(payload, type, config) {
  const key = type + "Standings";
  if (!payload?.[key]) return payload;

  const isDriver = type === "Driver";
  const fanCode = isDriver ? config.fanDriverCode : config.fanConstructorCode;
  const maxRows = isDriver ? config.maxRowsDriver : config.maxRowsConstructor;

  const fanPosition = findFan(payload[key], isDriver, fanCode);
  const slicedStandings = sliceStandings(payload[key], maxRows, fanPosition);

  return {
    ...payload,
    [key]: slicedStandings
  };
}

// Prepares the schedule data specifically for the next race.
// Determines the current race and the next race based on yesterday's date.
function processScheduleForNextRace(schedule, circuitImages, locale = "en", timeFormat = 24) {
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  })();

  const currentRound = findNextRound(schedule, yesterday);
  if (!currentRound) return null;

  return processScheduleForDisplay(schedule, currentRound, circuitImages, locale, timeFormat);
}

// Formats and processes the schedule data for display purposes.
function processScheduleForDisplay(
  schedule,
  currentRound,
  circuitImages,
  locale = "en",
  timeFormat = 24
) {
  const currentRace = schedule[currentRound - 1];
  const nextRace = schedule[currentRound];

  return {
    season: schedule[0].season,
    round: currentRound,
    raceName: currentRace.raceName,
    circuitImage: circuitImages[currentRace.Circuit.circuitId],
    circuitName: currentRace.Circuit.circuitName,
    raceDate: formatDateAndTime(currentRace, timeFormat, locale),
    qualifyingDate: formatDateAndTime(currentRace.Qualifying, timeFormat, locale),
    pract1Date: formatDateAndTime(currentRace.FirstPractice, timeFormat, locale),
    pract2Date: formatDateAndTime(currentRace.SecondPractice, timeFormat, locale),
    pract3Date: formatDateAndTime(currentRace.ThirdPractice, timeFormat, locale),
    sprintQualifyingDate: formatDateAndTime(currentRace.SprintQualifying, timeFormat, locale),
    sprintDate: formatDateAndTime(currentRace.Sprint, timeFormat, locale),
    nextRaceDate: nextRace ? formatDateAndTime(nextRace, timeFormat, locale) : null,
    nextRaceName: nextRace ? nextRace.raceName : null
  };
}

// Finds the next race round by comparing the race date with yesterday's date.
function findNextRound(dates, yesterday) {
  for (let i = 0; i < dates.length; i++) {
    const aDate = new Date(dates[i].date);
    if (aDate > new Date(yesterday)) {
      return dates[i].round;
    }
  }
  return null;
}

/* ---------------- Async Methods ---------------- */

// Utility to load nationalities and return them in a map.
// It fetches the nationality data from a given file and constructs a lookup map.
async function loadNationalities(file) {
  try {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
    const data = await response.json();
    const nationalitiesMap = {};
    for (const entry of data) {
      nationalitiesMap[entry.demonym] = entry.code.toLowerCase();
    }
    return nationalitiesMap;
  } catch (error) {
    console.error("Error loading nationalities:", error);
    return {};
  }
}

/* ---------------- Export ---------------- */

const MMMFormula1Utils = {
  sliceStandings,
  formatDateAndTime,
  shouldShowStanding,
  getCodeFromNationality,
  findFan,
  findNextRound,
  processStandingsWithFanData,
  processScheduleForDisplay,
  processScheduleForNextRace,
  loadNationalities
};

// Node / Vitest export
if (typeof module !== "undefined" && module.exports) {
  module.exports = MMMFormula1Utils;
}

// Optional browser fallback for MagicMirror
if (typeof window !== "undefined") {
  window.MMMFormula1Utils = MMMFormula1Utils;
}
