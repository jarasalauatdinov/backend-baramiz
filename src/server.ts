import app from "./app";
import { env, getAllowedOrigins } from "./config/env";

if (env.NODE_ENV === "production" && !env.PUBLIC_BASE_URL) {
  console.warn(
    "PUBLIC_BASE_URL is not set. Relative image paths may not resolve correctly for cross-origin frontends.",
  );
}

if (env.NODE_ENV !== "production") {
  console.log(`CORS allowed origins: ${getAllowedOrigins().join(", ")}`);
}

app.listen(env.PORT, () => {
  console.log(`Baramiz AI backend is running on port ${env.PORT}`);
});
