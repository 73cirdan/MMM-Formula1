// jolpiApi.js
const { fetchData } = require("./api"); // Import the generic fetchData function

/**
 * Fetch race standings or schedule from Ergast.
 * @param {string} type - The type of data to fetch (e.g., "DRIVERSTANDINGS", "SCHEDULE").
 * @param {string} season - The season to fetch data for.
 * @returns {Object|null} - Returns the requested data or null if error.
 */
async function fetchSeasonData(type, season) {
  const url = `https://api.jolpi.ca/ergast/f1/${season}/${type}Standings.json`;

  const result = await fetchData(url); // Use the generic fetchData function

  if (result.error) {
    console.error(`Ergast API error: ${result.error.message}`); // Log the error for debugging purposes
    return null; // Return a default value or null
  }

  // Parse the result in Ergast-specific way
  return result.data.MRData?.StandingsTable?.StandingsLists?.[0] || null;
}

/**
 * Fetch the F1 schedule from Ergast.
 * @param {string} season - The season to fetch data for.
 * @returns {Object|null} - Returns the schedule data or null if error.
 */
async function fetchSchedule(season) {
  const url = `https://api.jolpi.ca/ergast/f1/${season}`;

  const result = await fetchData(url); // Use the generic fetchData function

  if (result.error) {
    console.error(`Ergast API error: ${result.error.message}`); // Log the error for debugging purposes
    return null; // Return a default value or null
  }

  // Extract and return the schedule data (assuming the structure is `RaceTable.Races`)
  return result.data.MRData?.RaceTable?.Races || null;
}

module.exports = { fetchSeasonData, fetchSchedule };
