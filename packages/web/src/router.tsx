import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./routes/__root";
import { indexRoute } from "./routes/index";
import { settingsRoute } from "./routes/settings/index";
import { addRoute } from "./routes/add/index";
import { inventoryRoute } from "./routes/inventory/index";
import { reportsRoute } from "./routes/reports/index";

const routeTree = rootRoute.addChildren([
  indexRoute,
  settingsRoute,
  addRoute,
  inventoryRoute,
  reportsRoute
]);

export const router = createRouter({
  routeTree
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
