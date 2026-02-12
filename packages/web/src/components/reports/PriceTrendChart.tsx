import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "../../hooks/useReports";

type PriceTrendChartProps = {
  points: TrendPoint[];
  title?: string;
};

export function PriceTrendChart({ points, title = "Portfolio Value Trend" }: PriceTrendChartProps) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-bold">{title}</h3>
      <div className="mt-3 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `$${value}`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
            <Line dataKey="totalValue" stroke="#E3000B" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
