import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { corsMiddleware } from "./middleware/cors";
import { loggerMiddleware } from "./middleware/logger";
import { healthRoute } from "./routes/health";
import { membersRoute } from "./routes/members";
import { locationsRoute } from "./routes/locations";
import { lookupRoute } from "./routes/lookup";
import { setsRoute } from "./routes/sets";
import { pricesRoute } from "./routes/prices";
import { reportsRoute } from "./routes/reports";

const app = new Hono();
const isProduction = process.env.NODE_ENV === "production";

app.use("*", loggerMiddleware);
app.use("*", corsMiddleware);

app.route("/api", healthRoute);
app.route("/api", membersRoute);
app.route("/api", locationsRoute);
app.route("/api", lookupRoute);
app.route("/api", setsRoute);
app.route("/api", pricesRoute);
app.route("/api", reportsRoute);

if (isProduction) {
  const serveWeb = serveStatic({
    root: "./packages/web/dist",
    rewriteRequestPath: (path) => (path === "/" ? "/index.html" : path)
  });

  app.use("*", async (c, next) => {
    if (c.req.path.startsWith("/api")) {
      return next();
    }

    const response = await serveWeb(c, next);
    if (response.status !== 404) {
      return response;
    }

    return serveStatic({ root: "./packages/web/dist", path: "/index.html" })(c, next);
  });
}

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
