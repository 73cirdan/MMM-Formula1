const jsdoc = require("eslint-plugin-jsdoc");
const prettier = require("eslint-config-prettier");

module.exports = [
  // 🌐 Frontend (MagicMirror module)
  {
    files: ["MMM-Formula1.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",

      globals: {
        // MagicMirror globals
        Module: "readonly",
        Log: "readonly",
        MM: "readonly",
        config: "readonly",
        moment: "readonly",

        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        XMLHttpRequest: "readonly",
      },
    },

    plugins: { jsdoc },

    rules: {
      eqeqeq: "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
    },
  },

  // 🖥️ Node helper
  {
    files: ["node_helper.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",

      globals: {
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        process: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },

    plugins: { jsdoc },

    rules: {
      eqeqeq: "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
    },
  },

  // 🎨 Prettier (always last)
  prettier,
];
