import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../__root";

function ReportsPage() {
  return (
    <section>
      <h2 className="text-lg font-bold">Reports</h2>
      <p className="mt-2 text-gray-600">Report charts are added in Phase 5.</p>
    </section>
  );
}

export const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: ReportsPage
});
