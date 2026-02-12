import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/api-client";
import { useCreateInventory, type InventoryCondition } from "../../hooks/useInventory";

type SetFormProps = {
  setNum: string;
  onCreated?: (id: number) => void;
};

type Member = { id: number; name: string };
type Location = { id: number; name: string };

const conditions: Array<{ value: InventoryCondition; label: string }> = [
  { value: "new_sealed", label: "New / Sealed" },
  { value: "opened_complete", label: "Opened / Complete" },
  { value: "opened_incomplete", label: "Opened / Incomplete" }
];

export function SetForm({ setNum, onCreated }: SetFormProps) {
  const [ownerId, setOwnerId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [condition, setCondition] = useState<InventoryCondition>("new_sealed");
  const [quantity, setQuantity] = useState("1");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [dateAcquired, setDateAcquired] = useState("");
  const [notes, setNotes] = useState("");

  const membersQuery = useQuery({
    queryKey: ["members"],
    queryFn: () => apiClient.get<{ items: Member[] }>("/members")
  });

  const locationsQuery = useQuery({
    queryKey: ["locations"],
    queryFn: () => apiClient.get<{ items: Location[] }>("/locations")
  });

  const createInventory = useCreateInventory();

  const errorMessage = useMemo(() => {
    if (!createInventory.error) {
      return null;
    }
    return createInventory.error instanceof Error
      ? createInventory.error.message
      : "Unable to add set to inventory";
  }, [createInventory.error]);

  return (
    <form
      className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        createInventory.mutate(
          {
            setNum,
            ownerId: ownerId ? Number(ownerId) : null,
            locationId: locationId ? Number(locationId) : null,
            condition,
            quantity: Number(quantity || 1),
            purchasePrice: purchasePrice ? Number(purchasePrice) : null,
            dateAcquired: dateAcquired || null,
            notes: notes || null
          },
          {
            onSuccess: (response) => {
              onCreated?.(response.id);
            }
          }
        );
      }}
    >
      <h4 className="text-sm font-bold">Add to Inventory</h4>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-semibold">Owner</span>
          <select
            className="w-full rounded border border-gray-300 bg-white px-3 py-2"
            value={ownerId}
            onChange={(event) => setOwnerId(event.target.value)}
          >
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
            className="w-full rounded border border-gray-300 bg-white px-3 py-2"
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
            className="w-full rounded border border-gray-300 bg-white px-3 py-2"
            value={condition}
            onChange={(event) => setCondition(event.target.value as InventoryCondition)}
          >
            {conditions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-semibold">Quantity</span>
          <input
            type="number"
            min={1}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2"
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
            className="w-full rounded border border-gray-300 bg-white px-3 py-2"
            value={purchasePrice}
            onChange={(event) => setPurchasePrice(event.target.value)}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-semibold">Date Acquired</span>
          <input
            type="date"
            className="w-full rounded border border-gray-300 bg-white px-3 py-2"
            value={dateAcquired}
            onChange={(event) => setDateAcquired(event.target.value)}
          />
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="font-semibold">Notes</span>
        <textarea
          className="w-full rounded border border-gray-300 bg-white px-3 py-2"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>

      <button
        type="submit"
        className="rounded bg-red-600 px-3 py-2 font-semibold text-white disabled:opacity-50"
        disabled={createInventory.isPending}
      >
        {createInventory.isPending ? "Saving..." : "Add Set"}
      </button>

      {createInventory.isSuccess ? (
        <p className="text-sm text-green-700">Set added to inventory successfully.</p>
      ) : null}
      {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
    </form>
  );
}
