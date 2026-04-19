// racingHubApi.js
const { fetchData } = require("./api"); // Import the generic fetchData function

/**
 * Fetch the list of drivers for the specified season from RacingHub.
 * @param {string} season - The season to fetch data for.
 * @returns {Object|null} - Returns the list of drivers or null if an error occurs.
 */
async function fetchSeasonDrivers(season) {
  const racingHubUrl = `https://racinghub.net/api/v1/seasons/${season}/drivers`;

  try {
    const result = await fetchData(racingHubUrl); // Fetch the data using the generic fetchData function

    if (result.error) {
      console.error(`RacingHub API error: ${result.error.message}`); // Log the error for debugging purposes
      return null; // Return null if there was an error fetching the data
    }

    // Return the driver data from the RacingHub API response
    return result.data;
  } catch (error) {
    console.error(`Error fetching RacingHub season drivers:`, error);
    return null; // Return null if an error occurs
  }
}

/**
 * Fetch career highlights from RacingHub.
 * @param {string} driverId - The driver's ID from RacingHub.
 * @returns {Object|null} - Returns career highlight data or null if error.
 */
async function fetchDriverCareerHighlights(driverId) {
  const racingHubUrl = `https://racinghub.net/api/v1/drivers/${driverId}`;

  const result = await fetchData(racingHubUrl); // Use the generic fetchData function

  if (result.error) {
    console.error(`OpenF1 API error: ${result.error.message}`); // Log the error for debugging purposes
    return null; // Handle error or return a default value if needed
  }

  // Parse the result in RacingHub-specific way
  return result.data || null;
}

module.exports = { fetchSeasonDrivers, fetchDriverCareerHighlights };
