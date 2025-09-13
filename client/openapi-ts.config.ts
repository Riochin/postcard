import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "../server/openapi.json",
  output: {
    format: "prettier",
    path: "./src/api",
  },
  plugins: ["@hey-api/client-next"],
});
