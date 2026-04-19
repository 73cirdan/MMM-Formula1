// api.js
// This file contains functions to fetch data from an API, extract specific data, and handle errors.

// Utility function to create a consistent error format
const createError = (type, message, statusCode = 500) => ({
  type,
  message,
  statusCode
});

/**
 * Fetch data from a given URL.
 * @param {string} url - The URL to fetch data from.
 * @returns {Promise<Object>} - Resolves to the data or an error object.
 */
async function fetchData(url) {
  try {
    console.info(`MMM-Formula1, fetching: ${url}`);
    const response = await fetch(url);

    // Check for non-OK response statuses
    if (!response.ok) {
      return {
        error: createError("HTTP_ERROR", `HTTP ${response.status} for ${url}`, response.status)
      };
    }

    // Parse and return the JSON response
    const data = await response.json();
    return { data };
  } catch (err) {
    // Catch and handle network errors
    const message = err.cause ? err.cause : err.message;
    return {
      error: createError("NETWORK_ERROR", message, err.statusCode)
    };
  }
}

module.exports = {
  fetchData // Export the function so other modules can use it
};
