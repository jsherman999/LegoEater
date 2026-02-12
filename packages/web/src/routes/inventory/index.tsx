import { useMemo, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../__root";
import { SetCard } from "../../components/sets/SetCard";
import { useInventoryList } from "../../hooks/useInventory";

function InventoryPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date_added");
  const [condition, setCondition] = useState("");

  const filters = useMemo(
    () => ({
      page: 1,
      pageSize: 50,
      search,
      sort,
      condition
    }),
    [condition, search, sort]
  );

  const inventoryQuery = useInventoryList(filters);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold">Inventory</h2>

      <div className="grid gap-2 rounded-xl border border-gray-200 bg-white p-3 md:grid-cols-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name or set number"
          className="rounded border border-gray-300 px-3 py-2"
        />

        <select
          value={condition}
          onChange={(event) => setCondition(event.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
        >
          <option value="">All Conditions</option>
          <option value="new_sealed">New / Sealed</option>
          <option value="opened_complete">Opened / Complete</option>
          <option value="opened_incomplete">Opened / Incomplete</option>
        </select>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
        >
          <option value="date_added">Newest</option>
          <option value="name">Name</option>
          <option value="value">Value</option>
          <option value="year">Year</option>
        </select>
      </div>

      {inventoryQuery.isLoading ? <div className="skeleton h-16 rounded-xl" /> : null}
      {inventoryQuery.error ? (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {inventoryQuery.error instanceof Error ? inventoryQuery.error.message : "Failed to load inventory"}
        </p>
      ) : null}

      <p className="text-sm text-gray-600">{inventoryQuery.data?.total ?? 0} sets</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {(inventoryQuery.data?.items ?? []).map((item) => (
          <SetCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inventory",
  component: InventoryPage
});
