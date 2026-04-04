/* MagicMirror²
 * Module: MMM-Formula1
 *
 * By Cirdan, Ian Perrin http://github.com/ianperrin/MMM-Formula1
 * MIT Licensed.
 */

Module.register("MMM-Formula1", {
  // Default module configuration options.
  defaults: {
    season: "current", // Default season is "current"
    maxRowsDriver: 5, // Max number of driver standings to show
    maxRowsConstructor: 5, // Max number of constructor standings to show
    showStanding: "MIX", // Default display type (MIX: drivers and constructors)
    loadDriver: true, // Load driver data if required by showStanding config
    loadConstructor: false, // Load constructor data if required by showStanding config
    showSchedule: true, // Show the race schedule
    fade: false, // Apply fade effect in standings list
    fadePoint: 0.3, // Fade effect starts at this point in the standings list
    reloadInterval: 30 * 60 * 1000, // Interval to reload data (30 minutes)
    screenRefreshInterval: 30 * 1000, // Interval to refresh the screen (30 seconds)
    animationSpeed: 2.5 * 1000, // Animation speed (2.5 seconds)
    grayscale: false, // Enable grayscale for flag colors
    showNextRace: true // Show the next race when displaying the schedule
  },

  // Store data for driver, constructor, and schedule in local variables.
  dataDriver: null,
  dataConstructor: null,
  dataSchedule: null,
  endpoint: "/modules/MMM-Formula1/", // Base endpoint for API calls
  nodatacountD: 0, // Track missing data for drivers
  nodatacountC: 0, // Track missing data for constructors
  nodatacountS: 0, // Track missing data for schedule
  loading: true, // Loading state for the module

  // Circuit images for each Grand Prix location.
  circuitImages: {
    bahrain: "/bahrain.svg",
    jeddah: "/jeddah.svg",
    albert_park: "/australia.svg",
    suzuka: "/japan.svg",
    shanghai: "/china.svg",
    miami: "/miami.svg",
    imola: "/imola.svg",
    monaco: "/monaco.svg",
    villeneuve: "/canada.svg",
    catalunya: "/spain.svg",
    red_bull_ring: "/austria.svg",
    silverstone: "/greatbritain.svg",
    hungaroring: "/hungary.svg",
    spa: "/belgium.svg",
    zandvoort: "/netherlands.svg",
    monza: "/italy.svg",
    baku: "/azerbaijan.svg",
    marina_bay: "/singapore.svg",
    americas: "/usa.svg",
    rodriguez: "/mexico.svg",
    interlagos: "/brazil.svg",
    vegas: "/vegas.svg",
    losail: "/qatar.svg",
    madring: "/madring.svg",
    yas_marina: "/abudhabi.svg"
  },

  // Get the external script(s) needed for the module.
  getScripts() {
    return ["MMM-Formula1-utils.js"]; // Add the utility script
  },

  // Get the stylesheets needed for the module.
  getStyles() {
    return ["font-awesome.css", "MMM-Formula1.css"]; // Font-awesome and custom CSS
  },

  // Get translation files for different languages.
  getTranslations() {
    return {
      en: "translations/en.json",
      nl: "translations/nl.json",
      de: "translations/de.json",
      id: "translations/id.json",
      it: "translations/it.json",
      sv: "translations/sv.json",
      da: "translations/da.json",
      fr: "translations/fr.json",
      tr: "translations/tr.json",
      pt: "translations/pt-br.json"
    };
  },

  // Start the module and validate the config.
  start() {
    Log.info(`Starting module: ${this.name}`);
    this.validateConfig(); // Check the configuration validity

    // Load nationalities data (via API) and initialize filters
    var self = this;
    var filePath = self.endpoint + "nationalities.json";
    MMMFormula1Utils.loadNationalities(filePath)
      .then(function (nationalitiesMap) {
        self.nationalities = nationalitiesMap; // Store nationalities map
        self.addFilters(); // Add custom Nunjucks filters
      })
      .catch(function (error) {
        Log.error("Error loading nationalities:", error); // Log error if nationalities loading fails
      });

    // Start polling for data (via helper) and send configuration to socket.
    this.sendSocketNotification("CONFIG", this.config);

    // If the showStanding config is "MIX", update the DOM periodically.
    if (this.config.showStanding === "MIX") {
      this.scheduledTimer = setInterval(function () {
        self.updateDom(self.config.animationSpeed); // Periodic DOM updates
      }, this.config.screenRefreshInterval);
    }
  },

  // Handle socket notifications (received from the MagicMirror server).
  socketNotificationReceived(notification, payload) {
    Log.info(`${this.name} received a notification: ${notification}`);

    // Process the received notifications and update data accordingly
    switch (notification) {
      case "DRIVER":
        this.dataDriver = MMMFormula1Utils.processStandingsWithFanData(
          payload,
          "Driver",
          this.config
        );
        this.nodatacountD = 0; // Reset missing data counter for drivers
        break;
      case "CONSTRUCTOR":
        this.dataConstructor = MMMFormula1Utils.processStandingsWithFanData(
          payload,
          "Constructor",
          this.config
        );
        this.nodatacountC = 0; // Reset missing data counter for constructors
        break;
      case "SCHEDULE":
        this.dataSchedule = MMMFormula1Utils.processScheduleForNextRace(
          payload,
          this.circuitImages
        );
        this.nodatacountS = 0; // Reset missing data counter for schedule
        break;
      case "DRIVER_ERROR":
        this.nodatacountD++; // Increment driver error counter
        break;
      case "CONSTRUCTOR_ERROR":
        this.nodatacountC++; // Increment constructor error counter
        break;
      case "SCHEDULE_ERROR":
        this.nodatacountS++; // Increment schedule error counter
        break;
      default:
        Log.error(this.name + ": Notification not understood: " + notification); // Log unrecognized notifications
        break;
    }

    // Update loading state and refresh the DOM once data is received (or error occurs).
    this.loading = false;
    this.updateDom(this.config.animationSpeed);
  },

  // Define the template file used for rendering the module.
  getTemplate() {
    return "templates\\mmm-formula1-standings.njk"; // Use the Nunjucks template for standings
  },

  // Use the header to inform users about stale data.
  getHeader() {
    return (
      this.data.header +
      (this.nodatacountD > 0 ? " (D:" + this.nodatacountD + ")" : "") + // Show driver data error count
      (this.nodatacountC > 0 ? " (C:" + this.nodatacountC + ")" : "") + // Show constructor data error count
      (this.nodatacountS > 0 ? " (S:" + this.nodatacountS + ")" : "") // Show schedule data error count
    );
  },

  // Prepare the template data to be passed to Nunjucks.
  getTemplateData() {
    const templateData = {
      loading: this.loading, // Whether the module is still loading data
      config: this.config, // Current module configuration
      dataD: this.dataDriver, // Driver standings data
      dataC: this.dataConstructor, // Constructor standings data
      dataS: this.dataSchedule, // Schedule data
      endpointconstructors: this.endpoint + "/constructors/", // Endpoint for constructor data
      endpointtracks: this.endpoint + (this.config.grayscale ? "tracks" : "trackss"), // Endpoint for track data
      identifier: this.identifier, // Unique identifier for the module
      timeStamp: this.dataRefreshTimeStamp // Last data refresh timestamp
    };
    return templateData;
  },

  // Check for errors in the configuration and fix if necessary.
  validateConfig() {
    let configType = this.config.showStanding.toUpperCase(); // Normalize the standing type config
    const validTypes = ["NONE", "DRIVER", "CONSTRUCTOR", "BOTH", "MIX"];

    // Default to MIX if an invalid config value is provided
    if (!validTypes.includes(configType)) {
      this.config.showStanding = "MIX";
    }

    // Set flags for loading driver and constructor data based on showStanding config
    this.config.loadDriver = ["DRIVER", "BOTH", "MIX"].includes(configType);
    this.config.loadConstructor = ["CONSTRUCTOR", "BOTH", "MIX"].includes(configType);

    // Ensure there is something to show if no data is configured to be displayed
    if (!this.config.showSchedule && !this.config.loadDriver && !this.config.loadConstructor) {
      this.config.showSchedule = true; // Default to showing schedule if nothing else is enabled
    }
  },

  // Add custom Nunjucks filters to the template engine.
  addFilters() {
    const env = this.nunjucksEnvironment(); // Get the Nunjucks environment
    env.addFilter("getCodeFromNationality", (nationality) => {
      return MMMFormula1Utils.getCodeFromNationality(this.nationalities, nationality); // Get nationality code
    });
    env.addFilter("getFadeOpacity", this.getFadeOpacity.bind(this)); // Add fade opacity filter
    env.addFilter("showStanding", (showType) =>
      MMMFormula1Utils.shouldShowStanding(
        this.config.showStanding.toUpperCase(),
        showType,
        moment().second()
      )
    );
    env.addFilter("translate", this.translate.bind(this)); // Add translation filter
  },

  // Used to calculate fade effect in the standings list based on configuration.
  getFadeOpacity(index, itemCount) {
    const fadeStart = itemCount * this.config.fadePoint;
    const fadeItemCount = itemCount - fadeStart + 1;
    if (this.config.fade && index > fadeStart) {
      return 1 - (index - fadeStart) / fadeItemCount; // Apply fade effect
    }
    return 1; // No fade for items before the fade point
  }
});
