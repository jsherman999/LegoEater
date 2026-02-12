import type { SummaryReport } from "../../hooks/useReports";

type ValueSummaryProps = {
  summary: SummaryReport;
};

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function ValueSummary({ summary }: ValueSummaryProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <article className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500">Total Value</p>
        <p className="mt-1 text-xl font-black text-green-700">{money(summary.totalValue)}</p>
      </article>
      <article className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500">Total Invested</p>
        <p className="mt-1 text-xl font-black">{money(summary.totalInvested)}</p>
      </article>
      <article className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500">Gain / Loss</p>
        <p className={`mt-1 text-xl font-black ${summary.gainLoss >= 0 ? "text-green-700" : "text-red-700"}`}>
          {summary.gainLoss >= 0 ? "+" : "-"}
          {money(Math.abs(summary.gainLoss))}
        </p>
      </article>
      <article className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500">Inventory Count</p>
        <p className="mt-1 text-xl font-black">{summary.totalSets}</p>
      </article>
    </div>
  );
}
