import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../__root";

function InventoryPage() {
  return (
    <section>
      <h2 className="text-lg font-bold">Inventory</h2>
      <p className="mt-2 text-gray-600">Inventory list is added in Phase 3.</p>
    </section>
  );
}

export const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inventory",
  component: InventoryPage
});
