import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws on import outside a server context; stub it so we
      // can unit-test server route handlers (the real package guards prod builds).
      "server-only": fileURLToPath(new URL("./src/test/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    include: ["src/test/**/*.test.ts"],
    environment: "node",
    // The two image-embedding PDF cases can take 10–25 seconds under Vitest 4
    // on a cold Node/fontkit process. Route and ordinary export tests stay fast;
    // this prevents the runner's 5-second default from cancelling valid work.
    testTimeout: 30_000,
  },
});
