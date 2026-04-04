// vitest.config.js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.js", "tests/**/*.spec.js"],
    exclude: ["**/node_modules/**", "**/.git/**"],
    globals: true, // so you can use describe/it/expect without imports
    environment: "node"
  }
});
