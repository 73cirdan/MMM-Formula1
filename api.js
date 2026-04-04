// api.js
// This file contains functions to fetch data from an API, extract specific data, and handle errors.

const createError = (type, message, statusCode = 500) => ({
  type,
  message,
  statusCode
});

/**
 * Fetch data from a given URL.
 * @param {string} url - The URL to fetch data from.
 * @returns {Promise<Object>} - Returns a promise that resolves with the data or an error object.
 */
async function fetchData(url) {
  try {
    // Make an HTTP request using the fetch API
    const response = await fetch(url);

    // Check if the response status is not OK (e.g., 404 or 500)
    if (!response.ok) {
      return {
        error: createError("HTTP_ERROR", `HTTP ${response.status} for ${url}`, response.status)
      };
    }

    // Parse the response as JSON
    const data = await response.json();
    return { data };
  } catch (err) {
    //console.log('Fetch error:', err); // Debugging line to inspect the response
    // Catch any network-related errors
    const message = err.cause ? err.cause : err.message;
    return {
      error: createError("NETWORK_ERROR", message, err.statusCode)
    };
  }
}

/**
 * Extract relevant data based on the specified type from the fetched JSON.
 * @param {string} type - The type of data to extract (e.g., 'SCHEDULE' or 'STANDINGS').
 * @param {Object} json - The raw JSON data to extract from.
 * @returns {Object|null} - Returns the extracted data or null if no valid data is found.
 */
function extractData(type, json) {
  try {
    // Extract and return race schedule data if the type is "SCHEDULE"
    if (type === "SCHEDULE") {
      return json?.MRData?.RaceTable?.Races ?? null;
    }

    // Check if StandingsLists[0] contains valid data (not empty)
    const standings = json?.MRData?.StandingsTable?.StandingsLists?.[0];
    if (standings && Object.keys(standings).length > 0) {
      return standings; // Return the first standings if it's valid
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch data and extract the relevant portion based on the type.
 * @param {string} type - The type of data to fetch (e.g., 'SCHEDULE' or 'STANDINGS').
 * @param {string} url - The URL to fetch data from.
 * @returns {Promise<Object>} - Returns a promise that resolves with either the extracted data or an error object.
 */
async function fetchF1Data(type, url) {
  const result = await fetchData(url); // Fetch data from the provided URL
  //console.log('Fetch result:', result); // Debugging line to inspect the response

  if (result.error) return result;

  // Extract the relevant data from the fetched result
  const extracted = extractData(type, result.data);
  // console.log('Extracted Data:', extracted); // Debugging line to inspect the extracted data

  if (!extracted) {
    return { error: { type: "NO_DATA", message: "No usable data in API response" } };
  }

  // Return the extracted data if available
  return { data: extracted };
}

// Export the fetchF1Data function to make it available for use in other modules
module.exports = {
  fetchF1Data
};
