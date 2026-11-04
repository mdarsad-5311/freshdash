// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*", "admin-dashboard/**", "freshdash/**"],
  },
  {
    files: ["jest.setup.js", "**/__tests__/**/*.[jt]s?(x)"],
    rules: {
      "no-undef": "off",
    },
  },
]);
