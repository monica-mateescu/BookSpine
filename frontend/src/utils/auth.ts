import { dashClient, sentinelClient } from "@better-auth/infra/client";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const baseURL = import.meta.env.VITE_APP_SERVER_URL;

export const authClient = createAuthClient({
  baseURL: baseURL,
  plugins: [
    inferAdditionalFields({
      user: {
        lastName: {
          type: "string",
          required: false,
        },
        role: {
          type: "string",
          required: false,
        },
        deletedAt: {
          type: "date",
          required: false,
        },
      },
    }),
    dashClient(),
    sentinelClient({
      autoSolveChallenge: true,
    }),
  ],
  fetchOptions: {
    credentials: "include",
  },
});
