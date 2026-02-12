import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../__root";

function AddPage() {
  return (
    <section>
      <h2 className="text-lg font-bold">Add Set</h2>
      <p className="mt-2 text-gray-600">Set identification workflow is added in Phase 2.</p>
    </section>
  );
}

export const addRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/add",
  component: AddPage
});
