// openF1Api.js
const { fetchData } = require("./api"); // Import the generic fetchData function

/**
 * Fetch the driver image from OpenF1.
 * @param {string} driverId - The driver's permanent number.
 * @returns {Object|null} - Returns driver image data or null if error.
 */
async function fetchDriverProfile(driverId) {
  const openF1Url = `https://api.openf1.org/v1/drivers?session_key=latest&driver_number=${driverId}`;

  const result = await fetchData(openF1Url); // Use the generic fetchData function

  if (result.error) {
    console.error(`OpenF1 API error: ${result.error.message}`); // Log the error for debugging purposes
    return null; // Handle error or return a default value if needed
  }

  // Parse the result in OpenF1-specific way
  return Array.isArray(result.data) ? result.data[0] : null;
}

module.exports = { fetchDriverProfile };
