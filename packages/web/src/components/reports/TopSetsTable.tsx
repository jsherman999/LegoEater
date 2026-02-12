import { Link } from "@tanstack/react-router";
import type { TopSetItem } from "../../hooks/useReports";

type TopSetsTableProps = {
  items: TopSetItem[];
};

export function TopSetsTable({ items }: TopSetsTableProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <header className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-bold">Top Sets by Value</h3>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Set</th>
              <th className="px-4 py-2">Qty</th>
              <th className="px-4 py-2">Value</th>
              <th className="px-4 py-2">Gain/Loss</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  <Link to="/inventory/$setId" params={{ setId: String(item.id) }} className="font-semibold text-blue-700">
                    {item.setName}
                  </Link>
                  <p className="text-xs text-gray-500">{item.setNum}</p>
                </td>
                <td className="px-4 py-2">{item.quantity}</td>
                <td className="px-4 py-2">{item.marketValue === null ? "N/A" : `$${item.marketValue.toFixed(2)}`}</td>
                <td className={`px-4 py-2 ${item.gainLoss !== null && item.gainLoss >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {item.gainLoss === null
                    ? "N/A"
                    : `${item.gainLoss >= 0 ? "+" : "-"}$${Math.abs(item.gainLoss).toFixed(2)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
