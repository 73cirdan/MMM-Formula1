const jsdoc = require("eslint-plugin-jsdoc");
const prettier = require("eslint-config-prettier");
const globals = require("globals");

module.exports = [
  // 🌐 Frontend (MagicMirror module)
  {
    files: ["MMM-Formula1.js", "MMM-Formula1-utils.js" ],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",

      globals: {
        // MagicMirror globals
        Module: "readonly",
        Log: "readonly",
        MM: "readonly",
        MMMFormula1Utils: "readonly",
        config: "readonly",
        moment: "readonly",

        // Browser globals
        ...globals.browser,
        ...globals.node,
      }
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
        ...globals.node,
      }
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
