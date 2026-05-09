/*
 * MMM-Formula1 - Node Helper
 *
 * By cirdan http://github.com/73cirdan/MMM-Formula1
 * Forked from: Ian Perrin http://github.com/ianperrin/MMM-Formula1
 * MIT Licensed.
 */

// node_helper.js

const Log = require("logger"); // Importing a logger module for logging purposes
const NodeHelper = require("node_helper"); // Importing the NodeHelper class to manage the module lifecycle
const { fetchDriverProfile } = require("./openF1Api"); // Import the openF1Data methods
const { fetchSeasonData, fetchSchedule } = require("./jolpiApi"); // Import the Jolpi API methods
const { fetchSeasonDrivers, fetchDriverCareerHighlights } = require("./racingHubApi"); // Import the RacingHub API method

module.exports = NodeHelper.create({
  start() {
    Log.log(`Starting module: ${this.name}`); // Log that the module is starting
    this.config = {}; // Initialize an empty config object
    this.racingHubSeasonDriversData = null;
    this.cachedProfiles = {};
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload; // Store the received configuration in the config object
      this.season = new Date().getFullYear();
      this.restartPolling(); // Restart polling with the new configuration
    }

    if (notification === "DRIVER_PROFILE") {
      this.fetchDriverProfile(payload); // payload is the driver permanent number for this season
    }
  },

  restartPolling() {
    if (this.timerId) clearTimeout(this.timerId); // Clear any previous timeout
    this.fetchApiData(); // Start fetching new data
  },

  async fetchApiData() {
    await this.loadRacinghubSeasonDrivers(); // for resilience
    // Array to hold all the fetch requests
    const requests = [];

    if (this.config.loadDriverStandings) {
      requests.push(this.fetchStandings("driver"));
    }

    if (this.config.loadConstructorStandings) {
      requests.push(this.fetchStandings("constructor"));
    }

    // Fetch the schedule if needed
    if (this.config.showSchedule) {
      requests.push(this.fetchScheduleData(this.season)); // Fetch the schedule data
    }

    // Wait for all requests to complete
    const results = await Promise.allSettled(requests);
    results.forEach((r, idx) => {
      if (r.status === "rejected") Log.error(`API request ${idx} failed:`, r.reason);
    });

    // Schedule the next fetch based on the reload interval specified in the config
    this.timerId = setTimeout(() => this.fetchApiData(), this.config.reloadInterval);
  },

  // fetch standings from jolpi
  async fetchStandings(type) {
    const result = await fetchSeasonData(type, this.season);

    if (!result) {
      this.handleError(`${type.toUpperCase()}STANDINGS_ERROR`, "Failed to fetch standings");
      return;
    }

    this.sendSocketNotification(`${type.toUpperCase()}STANDINGS`, result);
  },
  // fetch schedule from jolpi
  async fetchScheduleData(season) {
    try {
      const scheduleData = await fetchSchedule(season); // Call Jolpi API for schedule
      if (scheduleData) {
        this.sendSocketNotification("SCHEDULE", scheduleData); // Send the schedule data to the frontend
      } else {
        this.handleError("SCHEDULE_ERROR", "Failed to fetch schedule");
      }
    } catch (error) {
      this.handleError("SCHEDULE_ERROR", error);
    }
  },
  // fetch driver profile data from open F1 api and racinghub hub api
  async fetchDriverProfile(driverStanding) {
    const driverId_F1 = driverStanding.Driver.permanentNumber;
    await this.loadRacinghubSeasonDrivers(); // for resilience

    try {
      // Fetch driver image from OpenF1
      const openF1Data = await fetchDriverProfile(driverId_F1);
      const hasOpenF1Data = openF1Data && openF1Data.headshot_url && openF1Data.team_colour;

      // Get RacingHub driver ID
      let driverId_RH = this.getDriverId_RH(driverId_F1);

      // Create the backup driver ID using - between first and last name, as back up if previous failed
      if (!driverId_RH && openF1Data) {
        driverId_RH = `${openF1Data.first_name.toLowerCase()}-${openF1Data.last_name.toLowerCase()}`;
      }

      // Fetch career highlights from RacingHub
      const careerHighlights = await fetchDriverCareerHighlights(driverId_RH);
      const hasCareerHighlights  = careerHighlights && careerHighlights.total_race_wins !== null;

      // Combine driver profile data
      const profileData = this.mergeProfileData(driverId_F1, 
                                           hasOpenF1Data ? openF1Data : null, 
                                           hasCareerHighlights   ? careerHighlights : null,
                                           driverStanding);

      // Send the combined driver profile data to the frontend
      this.sendSocketNotification("DRIVER_PROFILE", profileData);
    } catch (error) {
      this.handleError("DRIVER_PROFILE_ERROR", error);
    }
  },

  async loadRacinghubSeasonDrivers() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in ms

    // Check if cache exists and is still fresh
    if (
      this.racingHubSeasonDriversData &&
      this.racingHubSeasonDriversTimestamp &&
      now - this.racingHubSeasonDriversTimestamp < maxAge
    ) {
      return;
    }

    try {
      const driversData = await fetchSeasonDrivers(this.season); // Fetch drivers using RacingHub API
      if (driversData) {
        this.racingHubSeasonDriversData = driversData;
        this.racingHubSeasonDriversTimestamp = now;
      } else {
        this.handleError(`SEASON_DRIVERS_ERROR`, "Failed to fetch RacingHub season drivers");
      }
    } catch (error) {
      this.handleError(`SEASON_DRIVERS_ERROR`, error);
    }
  },

  // handles caching and combines a driver profile
  mergeProfileData(driverId, openF1, careerHighlights, standing) {
    const cachedProfile = this.cachedProfiles?.[driverId];

    const mergedProfileData = {
      careerHighlights: careerHighlights ?? cachedProfile?.careerHighlights ?? null,
      openF1: openF1 ?? cachedProfile?.openF1 ?? null,
      timestamp: new Date(),
      ...standing,
    };

    this.cachedProfiles[driverId] = mergedProfileData;

    return mergedProfileData; 
  },

  getDriverId_RH(number) {
    if (!this.racingHubSeasonDriversData) return null;
    const numStr = String(number);
    const driver = this.racingHubSeasonDriversData.find((d) => String(d.number) === numStr);
    return driver ? driver.id : null;
  },

  handleError(type, error) {
    Log.error(`${this.name} ${type} error:`, error);
    this.sendSocketNotification(type, error);
  }
});
