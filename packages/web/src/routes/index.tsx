import { createRoute, Link } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { ValueSummary } from "../components/reports/ValueSummary";
import { PriceTrendChart } from "../components/reports/PriceTrendChart";
import { TopSetsTable } from "../components/reports/TopSetsTable";
import { useMoversReport, useRecentReport, useSummaryReport, useTopSetsReport, useTrendReport } from "../hooks/useReports";

function DashboardPage() {
  const summaryQuery = useSummaryReport();
  const topSetsQuery = useTopSetsReport(10);
  const moversQuery = useMoversReport(30, 10);
  const recentQuery = useRecentReport(10);
  const trendsQuery = useTrendReport(90);

  if (summaryQuery.isLoading) {
    return <p className="text-gray-600">Loading dashboard...</p>;
  }

  if (summaryQuery.error || !summaryQuery.data) {
    return (
      <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {summaryQuery.error instanceof Error ? summaryQuery.error.message : "Unable to load dashboard"}
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold">Dashboard</h2>
      <ValueSummary summary={summaryQuery.data} />

      {trendsQuery.data ? <PriceTrendChart points={trendsQuery.data.items} /> : null}

      {topSetsQuery.data ? <TopSetsTable items={topSetsQuery.data.items} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-bold">Price Movers (30d)</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {(moversQuery.data?.items ?? []).slice(0, 5).map((item) => (
              <li key={item.setNum} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1">
                <span className="truncate pr-2">{item.setName}</span>
                <span className={item.changeValue >= 0 ? "text-green-700" : "text-red-700"}>
                  {item.changeValue >= 0 ? "+" : "-"}${Math.abs(item.changeValue).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <Link to="/reports" className="mt-3 inline-block text-sm font-semibold text-blue-700">
            View full reports
          </Link>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-bold">Recently Added</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {(recentQuery.data?.items ?? []).slice(0, 5).map((item) => (
              <li key={item.id} className="rounded bg-gray-50 px-2 py-1">
                <Link to="/inventory/$setId" params={{ setId: String(item.id) }} className="font-semibold text-blue-700">
                  {item.setName}
                </Link>
                <p className="text-xs text-gray-500">
                  {item.setNum} • Qty {item.quantity}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage
});
