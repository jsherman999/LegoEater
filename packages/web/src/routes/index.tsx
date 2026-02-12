import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";

function DashboardPage() {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">Dashboard</h2>
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5 text-gray-600">
        Dashboard widgets arrive in later phases.
      </div>
    </section>
  );
}

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage
});
