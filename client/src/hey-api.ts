import type { CreateClientConfig } from "@/src/api/client";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});
