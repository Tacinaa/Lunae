// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // Flags setIsLoading(true)/setError(null) at the top of a data-fetching effect —
      // the standard "refetch when a dependency changes" pattern used throughout this app
      // (MainCalendarScreen, SearchSheet, etc.). Not adopting a data-fetching library for
      // this MVP, so this rule would otherwise fire on every fetch-on-mount/dependency effect.
      "react-hooks/set-state-in-effect": "off",
      // Known false positive with axios's dual CJS/ESM export shape: axios.create()/
      // axios.isAxiosError() are the documented, correct way to use the default export.
      "import/no-named-as-default-member": "off",
    },
  },
]);
