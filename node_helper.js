/*
 * MMM-Formula1 - Node Helper
 *
 * By cirdan http://github.com/73cirdan/MMM-Formula1
 * Forked from: Ian Perrin http://github.com/ianperrin/MMM-Formula1
 * MIT Licensed.
 */

const Log = require("logger"); // Importing a logger module for logging purposes
const NodeHelper = require("node_helper"); // Importing the NodeHelper class to manage the module lifecycle
const { fetchF1Data } = require("./api"); // Importing the fetchF1Data function from the api.js file

// The main NodeHelper object that manages fetching data from the API and sending it to the frontend
module.exports = NodeHelper.create({
  /**
   * The start function is executed when the module is started.
   * It initializes the configuration.
   */
  start() {
    Log.log(`Starting module: ${this.name}`); // Log that the module is starting
    this.config = {}; // Initialize an empty config object
  },

  /**
   * This function handles the reception of socket notifications.
   * When the "CONFIG" notification is received, it stores the payload in the config.
   * It also restarts polling by calling restartPolling().
   *
   * @param {string} notification - The name of the notification received.
   * @param {any} payload - The payload data sent with the notification.
   */
  socketNotificationReceived(notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload; // Store the received configuration in the config object
      this.restartPolling(); // Restart polling with the new configuration
    }
  },

  /**
   * This function is responsible for stopping any existing polling and starting fresh polling.
   * It clears any previous timeouts and triggers the fetchApiData() function to fetch new data.
   */
  restartPolling() {
    if (this.timerId) clearTimeout(this.timerId); // Clear any previous timeout
    this.fetchApiData(); // Start fetching new data
  },

  /**
   * This function fetches the F1 data based on the current configuration.
   * It builds the appropriate API URLs for driver standings, constructor standings, and schedule.
   * It then makes multiple requests in parallel to the API.
   * The results of the requests are sent to the frontend using socket notifications.
   */
  async fetchApiData() {
    // Determine the season based on the configuration (use current year if "current" is selected)
    const season = this.config.season === "current" ? new Date().getFullYear() : this.config.season;

    // Build the base URL for the API
    const baseUrl = `https://api.jolpi.ca/ergast/f1/${season}`;

    // Array to hold all the fetch requests
    const requests = [];

    // Push the respective requests based on the configuration
    if (this.config.loadDriver) {
      requests.push(this.handleRequest("DRIVER", `${baseUrl}/DriverStandings.json`));
    }

    if (this.config.loadConstructor) {
      requests.push(this.handleRequest("CONSTRUCTOR", `${baseUrl}/constructorStandings.json`));
    }

    if (this.config.showSchedule) {
      requests.push(this.handleRequest("SCHEDULE", `${baseUrl}.json`));
    }

    // Wait for all requests to complete
    await Promise.all(requests);

    // Schedule the next fetch based on the reload interval specified in the config
    this.timerId = setTimeout(() => this.fetchApiData(), this.config.reloadInterval);
  },

  /**
   * This function handles the individual fetch request for a specific type of data.
   * It fetches the data from the API and then sends the result to the frontend.
   * If there is an error, it sends an error notification instead.
   *
   * @param {string} type - The type of data being fetched (e.g., "DRIVER", "CONSTRUCTOR", "SCHEDULE").
   * @param {string} url - The URL to fetch the data from.
   */
  async handleRequest(type, url) {
    Log.log(`${this.name} fetching ${type}: ${url}`); // Log the type of data being fetched and the URL

    // Fetch the data using the fetchF1Data function
    const result = await fetchF1Data(type, url);

    // If there was an error in the result, log it and send an error notification
    if (result.error) {
      Log.error(`${this.name} ${type} error:`, result.error);
      this.sendSocketNotification(`${type}_ERROR`, result.error); // Send the error to the frontend
      return;
    }

    // If the fetch was successful, send the fetched data to the frontend
    this.sendSocketNotification(type, result.data);
  }
});
