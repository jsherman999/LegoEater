import { Link } from "@tanstack/react-router";
import type { InventoryItem } from "../../hooks/useInventory";

type SetCardProps = {
  item: InventoryItem;
};

const conditionLabels: Record<InventoryItem["condition"], string> = {
  new_sealed: "New / Sealed",
  opened_complete: "Opened / Complete",
  opened_incomplete: "Opened / Incomplete"
};

export function SetCard({ item }: SetCardProps) {
  return (
    <Link
      to="/inventory/$setId"
      params={{ setId: String(item.id) }}
      className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex gap-3">
        {item.setImgUrl ? (
          <img src={item.setImgUrl} alt={item.setName} className="h-20 w-20 rounded object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded bg-gray-100 text-xs text-gray-500">No Image</div>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate text-sm font-bold text-gray-900">{item.setName}</h3>
          <p className="text-xs text-gray-600">{item.setNum}</p>
          <p className="text-xs text-gray-600">{item.themeName ?? "Unknown Theme"}</p>
          <div className="flex flex-wrap gap-1 text-xs">
            {item.ownerName ? <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">{item.ownerName}</span> : null}
            <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">{conditionLabels[item.condition]}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-gray-50 px-2 py-1">
          <p className="text-gray-500">Qty</p>
          <p className="font-semibold">{item.quantity}</p>
        </div>
        <div className="rounded bg-gray-50 px-2 py-1">
          <p className="text-gray-500">Market Value</p>
          <p className="font-semibold text-green-700">
            {item.marketValue === null ? "N/A" : `$${item.marketValue.toFixed(2)}`}
          </p>
        </div>
        <div className="rounded bg-gray-50 px-2 py-1">
          <p className="text-gray-500">Gain/Loss</p>
          <p className={`font-semibold ${item.gainLoss !== null && item.gainLoss >= 0 ? "text-green-700" : "text-red-700"}`}>
            {item.gainLoss === null ? "N/A" : `${item.gainLoss >= 0 ? "+" : "-"}$${Math.abs(item.gainLoss).toFixed(2)}`}
          </p>
        </div>
      </div>
    </Link>
  );
}
