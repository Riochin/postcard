import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource.js";
import { data } from "./data/resource.js";
import { storage } from "./storage/resource.js";
import { CfnAPIKey } from "aws-cdk-lib/aws-location";

const backend = defineBackend({
  auth,
  data,
  storage,
});

const locationStack = backend.createStack("location-stack");

new CfnAPIKey(locationStack, "LocationApiKey", {
  keyName: "api-key",
  noExpiry: true,
  restrictions: {
    allowActions: ["geo-maps:*"],
    allowResources: [
      `arn:aws:geo-maps:${locationStack.region}::provider/default`,
    ],
  },
});
