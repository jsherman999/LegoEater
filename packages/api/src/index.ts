import { Hono } from "hono";
import { corsMiddleware } from "./middleware/cors";
import { loggerMiddleware } from "./middleware/logger";
import { healthRoute } from "./routes/health";
import { membersRoute } from "./routes/members";
import { locationsRoute } from "./routes/locations";
import { lookupRoute } from "./routes/lookup";

const app = new Hono();

app.use("*", loggerMiddleware);
app.use("*", corsMiddleware);

app.route("/api", healthRoute);
app.route("/api", membersRoute);
app.route("/api", locationsRoute);
app.route("/api", lookupRoute);

app.get("/", (c) => c.json({ app: "LegoEater API", status: "ok" }));

const port = Number(process.env.API_PORT ?? 3000);

if (import.meta.main) {
  Bun.serve({
    port,
    fetch: app.fetch
  });

  console.log(`LegoEater API listening on http://localhost:${port}`);
}

export default app;
