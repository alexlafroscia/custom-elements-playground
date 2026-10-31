import { playwright } from "@vitest/browser-playwright";
import { mergeConfig } from "vitest/config";

import buildConfig from "./vite.config.ts";

export default mergeConfig(buildConfig, {
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      // https://vitest.dev/config/browser/playwright
      instances: [{ browser: "chromium" }],
    },
  },
});
