import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  client: "@hey-api/client-next",
  input: "../server/openapi.json",
  output: {
    format: "prettier",
    path: "./src/api",
  },
  types: {
    enums: "javascript",
  },
});
