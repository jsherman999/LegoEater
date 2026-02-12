import { useEffect, useState } from "react";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "../__root";
import { apiClient } from "../../lib/api-client";
import { useDeleteInventory, useInventoryItem, useUpdateInventory, type InventoryCondition } from "../../hooks/useInventory";
import { usePriceHistory } from "../../hooks/usePrices";
import { SetPriceHistoryChart } from "../../components/reports/SetPriceHistoryChart";

type Member = { id: number; name: string };
type Location = { id: number; name: string };

const conditionOptions: Array<{ value: InventoryCondition; label: string }> = [
  { value: "new_sealed", label: "New / Sealed" },
  { value: "opened_complete", label: "Opened / Complete" },
  { value: "opened_incomplete", label: "Opened / Incomplete" }
];

function InventoryDetailPage() {
  const { setId } = setDetailRoute.useParams();
  const navigate = useNavigate();

  const detailQuery = useInventoryItem(setId);
  const updateMutation = useUpdateInventory(setId);
  const deleteMutation = useDeleteInventory();
  const historyQuery = usePriceHistory(detailQuery.data?.setNum ?? "", 90);

  const membersQuery = useQuery({
    queryKey: ["members"],
    queryFn: () => apiClient.get<{ items: Member[] }>("/members")
  });

  const locationsQuery = useQuery({
    queryKey: ["locations"],
    queryFn: () => apiClient.get<{ items: Location[] }>("/locations")
  });

  const [ownerId, setOwnerId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [condition, setCondition] = useState<InventoryCondition>("new_sealed");
  const [quantity, setQuantity] = useState("1");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [dateAcquired, setDateAcquired] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }

    setOwnerId(detailQuery.data.ownerId ? String(detailQuery.data.ownerId) : "");
    setLocationId(detailQuery.data.locationId ? String(detailQuery.data.locationId) : "");
    setCondition(detailQuery.data.condition);
    setQuantity(String(detailQuery.data.quantity));
    setPurchasePrice(detailQuery.data.purchasePrice === null ? "" : String(detailQuery.data.purchasePrice));
    setDateAcquired(detailQuery.data.dateAcquired ?? "");
    setNotes(detailQuery.data.notes ?? "");
  }, [detailQuery.data]);

  if (detailQuery.isLoading) {
    return <p className="text-gray-600">Loading set detail...</p>;
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {detailQuery.error instanceof Error ? detailQuery.error.message : "Set not found"}
      </p>
    );
  }

  const item = detailQuery.data;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold">{item.setName}</h2>
      <p className="text-sm text-gray-600">Set {item.setNum}</p>

      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-[180px,1fr]">
        {item.setImgUrl ? (
          <img src={item.setImgUrl} alt={item.setName} className="h-44 w-full rounded object-cover" />
        ) : (
          <div className="flex h-44 w-full items-center justify-center rounded bg-gray-100 text-sm text-gray-500">No Image</div>
        )}

        <div className="grid gap-2 text-sm md:grid-cols-2">
          <div className="rounded bg-gray-50 p-2">
            <p className="text-gray-500">Theme</p>
            <p className="font-semibold">{item.themeName ?? "Unknown"}</p>
          </div>
          <div className="rounded bg-gray-50 p-2">
            <p className="text-gray-500">Year</p>
            <p className="font-semibold">{item.year ?? "Unknown"}</p>
          </div>
          <div className="rounded bg-gray-50 p-2">
            <p className="text-gray-500">Latest Price (Each)</p>
            <p className="font-semibold">{item.latestPrice === null ? "N/A" : `$${item.latestPrice.toFixed(2)}`}</p>
          </div>
          <div className="rounded bg-gray-50 p-2">
            <p className="text-gray-500">Market Value</p>
            <p className="font-semibold text-green-700">{item.marketValue === null ? "N/A" : `$${item.marketValue.toFixed(2)}`}</p>
          </div>
          <div className="rounded bg-gray-50 p-2">
            <p className="text-gray-500">Purchase Price</p>
            <p className="font-semibold">{item.purchasePrice === null ? "N/A" : `$${item.purchasePrice.toFixed(2)}`}</p>
          </div>
          <div className="rounded bg-gray-50 p-2">
            <p className="text-gray-500">Gain/Loss</p>
            <p className={`font-semibold ${item.gainLoss !== null && item.gainLoss >= 0 ? "text-green-700" : "text-red-700"}`}>
              {item.gainLoss === null ? "N/A" : `${item.gainLoss >= 0 ? "+" : "-"}$${Math.abs(item.gainLoss).toFixed(2)}`}
            </p>
          </div>
        </div>
      </div>

      <form
        className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          updateMutation.mutate({
            ownerId: ownerId ? Number(ownerId) : null,
            locationId: locationId ? Number(locationId) : null,
            condition,
            quantity: Number(quantity),
            purchasePrice: purchasePrice ? Number(purchasePrice) : null,
            dateAcquired: dateAcquired || null,
            notes: notes || null
          });
        }}
      >
        <h3 className="text-base font-bold">Edit Inventory Entry</h3>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-semibold">Owner</span>
            <select className="w-full rounded border px-3 py-2" value={ownerId} onChange={(event) => setOwnerId(event.target.value)}>
              <option value="">Unassigned</option>
              {(membersQuery.data?.items ?? []).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-semibold">Location</span>
            <select
              className="w-full rounded border px-3 py-2"
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
            >
              <option value="">Unassigned</option>
              {(locationsQuery.data?.items ?? []).map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-semibold">Condition</span>
            <select
              className="w-full rounded border px-3 py-2"
              value={condition}
              onChange={(event) => setCondition(event.target.value as InventoryCondition)}
            >
              {conditionOptions.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-semibold">Quantity</span>
            <input
              type="number"
              min={1}
              className="w-full rounded border px-3 py-2"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-semibold">Purchase Price</span>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full rounded border px-3 py-2"
              value={purchasePrice}
              onChange={(event) => setPurchasePrice(event.target.value)}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-semibold">Date Acquired</span>
            <input
              type="date"
              className="w-full rounded border px-3 py-2"
              value={dateAcquired}
              onChange={(event) => setDateAcquired(event.target.value)}
            />
          </label>
        </div>

        <label className="space-y-1 text-sm">
          <span className="font-semibold">Notes</span>
          <textarea className="w-full rounded border px-3 py-2" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded bg-red-600 px-3 py-2 font-semibold text-white disabled:opacity-50"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            className="rounded bg-gray-800 px-3 py-2 font-semibold text-white"
            onClick={() => navigate({ to: "/inventory" })}
          >
            Back to Inventory
          </button>

          <button
            type="button"
            className="rounded bg-red-100 px-3 py-2 font-semibold text-red-700"
            disabled={deleteMutation.isPending}
            onClick={() => {
              deleteMutation.mutate(setId, {
                onSuccess: () => {
                  navigate({ to: "/inventory" });
                }
              });
            }}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Set"}
          </button>
        </div>

        {updateMutation.isSuccess ? <p className="text-sm text-green-700">Saved.</p> : null}
        {updateMutation.error ? (
          <p className="text-sm text-red-700">{updateMutation.error instanceof Error ? updateMutation.error.message : "Save failed"}</p>
        ) : null}
      </form>

      <SetPriceHistoryChart items={historyQuery.data?.items ?? []} />
    </section>
  );
}

export const setDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inventory/$setId",
  component: InventoryDetailPage
});
