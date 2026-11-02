// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*"],
  },
  {
    files: ["jest.setup.js", "**/__tests__/**/*.[jt]s?(x)"],
    rules: {
      "no-undef": "off",
    },
  },
]);
