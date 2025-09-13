import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "postcard-dev-s3-bucket-amplify",
  access: (allow) => ({
    "images/*": [
      allow.guest.to(["read"]),
      allow.authenticated.to(["read", "write", "delete"]),
    ],
    "documents/*": [allow.authenticated.to(["read", "write", "delete"])],
  }),
});
