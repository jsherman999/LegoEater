import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PricePoint } from "../../hooks/usePrices";

type SetPriceHistoryChartProps = {
  items: PricePoint[];
};

export function SetPriceHistoryChart({ items }: SetPriceHistoryChartProps) {
  const data = items
    .filter((item) => item.avgPrice !== null)
    .map((item) => ({ date: item.date, avgPrice: item.avgPrice as number }));

  if (data.length === 0) {
    return (
      <article className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-bold">Price History</h3>
        <p className="mt-2 text-sm text-gray-600">No price history yet.</p>
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-bold">Price History</h3>
      <div className="mt-3 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
            <Line dataKey="avgPrice" stroke="#2563EB" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
