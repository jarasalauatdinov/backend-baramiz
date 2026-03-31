import app from "./app";
import { env } from "./config/env";

if (env.NODE_ENV === "production" && !env.PUBLIC_BASE_URL) {
  console.warn(
    "PUBLIC_BASE_URL is not set. Relative image paths may not resolve correctly for cross-origin frontends.",
  );
}

app.listen(env.PORT, () => {
  console.log(`Baramiz AI backend is running on port ${env.PORT}`);
});
