import { configDefaults, defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    // Design handoff folders hold reference copies, not app code.
    exclude: [...configDefaults.exclude, "design_handoff_*/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "."),
    },
  },
});
