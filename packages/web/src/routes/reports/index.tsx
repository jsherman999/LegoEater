import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../__root";
import { PriceTrendChart } from "../../components/reports/PriceTrendChart";
import { TopSetsTable } from "../../components/reports/TopSetsTable";
import { ValueByMemberChart } from "../../components/reports/ValueByMemberChart";
import { ValueByThemeChart } from "../../components/reports/ValueByThemeChart";
import { useByMemberReport, useByThemeReport, useTopSetsReport, useTrendReport } from "../../hooks/useReports";

function ReportsPage() {
  const byMemberQuery = useByMemberReport();
  const byThemeQuery = useByThemeReport();
  const trendQuery = useTrendReport(90);
  const topSetsQuery = useTopSetsReport(20);

  if (byMemberQuery.isLoading || byThemeQuery.isLoading || trendQuery.isLoading) {
    return <p className="text-gray-600">Loading reports...</p>;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold">Reports</h2>

      {trendQuery.data ? <PriceTrendChart points={trendQuery.data.items} /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {byMemberQuery.data ? <ValueByMemberChart items={byMemberQuery.data.items} /> : null}
        {byThemeQuery.data ? <ValueByThemeChart items={byThemeQuery.data.items} /> : null}
      </div>

      {topSetsQuery.data ? <TopSetsTable items={topSetsQuery.data.items} /> : null}
    </section>
  );
}

export const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: ReportsPage
});
