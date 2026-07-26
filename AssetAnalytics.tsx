// ════════════════════════════════════════════════════════════════
// SIVRIS — Asset Portfolio analytics dashboard
// ----------------------------------------------------------------
// Power BI-style ECharts visualisations computed from the asset
// register. Lazy-loaded by the portfolio page.
// ════════════════════════════════════════════════════════════════
import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "@/hooks/useTheme";
import { echartsTheme, echartsDarkTheme } from "@/lib/chart-theme";
import type { Asset } from "@/types/asset";
import { assetService } from "@/services/assetService";
import { CATEGORY_COLORS, CONDITION_COLORS, formatCompactGBP, formatGBP } from "./assetData";

const BRAND = ["#0062AD", "#d15914", "#306eb8", "#ff8735", "#9cc2e5", "#808080", "#021733", "#22c55e"];

export default function AssetAnalytics({ assets }: { assets: Asset[] }) {
  const { theme } = useTheme();
  const eTheme = theme === "dark" ? echartsDarkTheme : echartsTheme;
  const legendColor = theme === "dark" ? "#cbd5e1" : "#475569";

  // Compute analytics directly from the supplied (scoped) asset list so the
  // dashboard reflects the active company/category scope.
  const analytics = useMemo(() => {
    // Reuse the service's pure computation by passing through its mock path.
    void assetService; // service available for real-backend wiring
    const live = assets.filter((a) => a.status !== "Disposed" && a.status !== "Written Off");

    const byCategory = new Map<string, { value: number; count: number }>();
    const byCompany = new Map<string, number>();
    const byLocation = new Map<string, number>();
    live.forEach((a) => {
      const c = byCategory.get(a.category) ?? { value: 0, count: 0 };
      c.value += a.currentBookValue; c.count++; byCategory.set(a.category, c);
      byCompany.set(a.company, (byCompany.get(a.company) ?? 0) + a.currentBookValue);
      byLocation.set(a.location, (byLocation.get(a.location) ?? 0) + a.currentBookValue);
    });

    const ageCounts = [0, 0, 0, 0, 0];
    live.forEach((a) => {
      const y = a.ageMonths / 12;
      if (y < 1) ageCounts[0]++; else if (y < 3) ageCounts[1]++; else if (y < 5) ageCounts[2]++; else if (y < 8) ageCounts[3]++; else ageCounts[4]++;
    });

    const conditions = ["Excellent", "Good", "Fair", "Poor"] as const;
    const condDist = conditions.map((name) => ({ name, value: live.filter((a) => a.condition === name).length }));

    const years = ["2020", "2021", "2022", "2023", "2024", "2025", "2026"];
    const valueOverTime = years.map((yr) => {
      const y = Number(yr);
      let total = 0;
      live.forEach((a) => { const row = a.depreciation.rows.find((r) => r.year === y); if (row) total += row.closingValue; });
      return { label: yr, value: Math.round(total) };
    });

    const maintByYear = new Map<string, number>();
    assets.forEach((a) => a.maintenance.forEach((m) => maintByYear.set(m.date.slice(0, 4), (maintByYear.get(m.date.slice(0, 4)) ?? 0) + m.cost)));

    const warranty: { month: string; count: number }[] = [];
    const base = new Date("2026-06-01");
    for (let i = 0; i < 24; i++) {
      const d = new Date(base); d.setMonth(d.getMonth() + i);
      warranty.push({ month: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }), count: live.filter((a) => a.warranty.endDate.slice(0, 7) === d.toISOString().slice(0, 7)).length });
    }

    return {
      byCategory: Array.from(byCategory.entries()).map(([name, v]) => ({ name, value: Math.round(v.value), count: v.count })),
      byCompany: Array.from(byCompany.entries()).map(([name, value]) => ({ name, value: Math.round(value) })),
      byLocation: Array.from(byLocation.entries()).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value: Math.round(value) })),
      ageDistribution: ["0–1y", "1–3y", "3–5y", "5–8y", "8y+"].map((bracket, i) => ({ bracket, count: ageCounts[i] })),
      conditionDistribution: condDist,
      valueOverTime,
      maintenanceByYear: Array.from(maintByYear.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([year, cost]) => ({ year, cost: Math.round(cost) })),
      warrantyExpiry: warranty,
      topAssets: [...live].sort((a, b) => b.currentBookValue - a.currentBookValue).slice(0, 10),
      dueForReplacement: live.filter((a) => a.lifeConsumedPct >= 80).sort((a, b) => b.lifeConsumedPct - a.lifeConsumedPct),
    };
  }, [assets]);

  // ─── Chart option builders ───
  const valueAreaOption = {
    ...eTheme,
    tooltip: { trigger: "axis", valueFormatter: (v: number) => formatGBP(v) },
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    xAxis: { type: "category", data: analytics.valueOverTime.map((d) => d.label) },
    yAxis: { type: "value", axisLabel: { formatter: (v: number) => formatCompactGBP(v) } },
    series: [{
      type: "line", smooth: true, data: analytics.valueOverTime.map((d) => d.value),
      areaStyle: { color: "rgba(0,98,173,0.18)" }, lineStyle: { color: "#0062AD", width: 2 }, itemStyle: { color: "#0062AD" },
    }],
  };

  const categoryDonut = {
    ...eTheme,
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, type: "scroll", textStyle: { color: legendColor } },
    series: [{
      type: "pie", radius: ["42%", "70%"], center: ["50%", "44%"],
      data: analytics.byCategory.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: CATEGORY_COLORS[d.name as keyof typeof CATEGORY_COLORS] } })),
      label: { show: false }, itemStyle: { borderRadius: 6, borderColor: "var(--surface-elevated)", borderWidth: 2 },
    }],
  };

  const companyDonut = {
    ...eTheme,
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, type: "scroll", textStyle: { color: legendColor } },
    color: BRAND,
    series: [{ type: "pie", radius: ["42%", "70%"], center: ["50%", "44%"], data: analytics.byCompany, label: { show: false }, itemStyle: { borderRadius: 6, borderColor: "var(--surface-elevated)", borderWidth: 2 } }],
  };

  const locationBar = {
    ...eTheme,
    tooltip: { trigger: "axis", valueFormatter: (v: number) => formatGBP(v) },
    grid: { left: 160, right: 30, top: 10, bottom: 20 },
    xAxis: { type: "value", axisLabel: { formatter: (v: number) => formatCompactGBP(v) } },
    yAxis: { type: "category", data: analytics.byLocation.map((d) => d.name).reverse() },
    series: [{ type: "bar", data: analytics.byLocation.map((d) => d.value).reverse(), itemStyle: { color: "#0062AD", borderRadius: [0, 4, 4, 0] }, barWidth: "55%" }],
  };

  const ageHistogram = {
    ...eTheme,
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: "category", data: analytics.ageDistribution.map((d) => d.bracket) },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: analytics.ageDistribution.map((d) => d.count), itemStyle: { color: "#306eb8", borderRadius: [4, 4, 0, 0] }, barWidth: "55%" }],
  };

  const conditionPie = {
    ...eTheme,
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, textStyle: { color: legendColor } },
    series: [{
      type: "pie", radius: "65%", center: ["50%", "44%"],
      data: analytics.conditionDistribution.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: CONDITION_COLORS[d.name as keyof typeof CONDITION_COLORS] } })),
      label: { show: false },
    }],
  };

  const warrantyTimeline = {
    ...eTheme,
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 20, top: 20, bottom: 50 },
    xAxis: { type: "category", data: analytics.warrantyExpiry.map((d) => d.month), axisLabel: { rotate: 45, fontSize: 9 } },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: analytics.warrantyExpiry.map((d) => d.count), itemStyle: { color: "#d15914", borderRadius: [4, 4, 0, 0] } }],
  };

  const maintenanceBar = {
    ...eTheme,
    tooltip: { trigger: "axis", valueFormatter: (v: number) => formatGBP(v) },
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    xAxis: { type: "category", data: analytics.maintenanceByYear.map((d) => d.year) },
    yAxis: { type: "value", axisLabel: { formatter: (v: number) => formatCompactGBP(v) } },
    series: [{ type: "bar", data: analytics.maintenanceByYear.map((d) => d.cost), itemStyle: { color: "#ff8735", borderRadius: [4, 4, 0, 0] }, barWidth: "50%" }],
  };

  const costTreemap = {
    ...eTheme,
    tooltip: { formatter: (info: { name: string; value: number }) => `${info.name}: ${formatGBP(info.value)}` },
    series: [{
      type: "treemap", roam: false, breadcrumb: { show: false }, nodeClick: false,
      data: analytics.byCategory.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: CATEGORY_COLORS[d.name as keyof typeof CATEGORY_COLORS] } })),
      label: { color: "#fff", fontSize: 12 }, itemStyle: { borderColor: "var(--surface-elevated)", borderWidth: 2, gapWidth: 2 },
    }],
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Total Asset Value Over Time"><ReactECharts option={valueAreaOption} style={{ height: 280 }} notMerge lazyUpdate /></Card>
        <Card title="Allocation by Category"><ReactECharts option={categoryDonut} style={{ height: 280 }} notMerge lazyUpdate /></Card>
        <Card title="Allocation by Company / Subsidiary"><ReactECharts option={companyDonut} style={{ height: 280 }} notMerge lazyUpdate /></Card>
        <Card title="Value by Location"><ReactECharts option={locationBar} style={{ height: 280 }} notMerge lazyUpdate /></Card>
        <Card title="Age Distribution"><ReactECharts option={ageHistogram} style={{ height: 280 }} notMerge lazyUpdate /></Card>
        <Card title="Condition Distribution"><ReactECharts option={conditionPie} style={{ height: 280 }} notMerge lazyUpdate /></Card>
        <Card title="Warranty Expiration Timeline (24 months)"><ReactECharts option={warrantyTimeline} style={{ height: 280 }} notMerge lazyUpdate /></Card>
        <Card title="Annual Maintenance Cost Trend"><ReactECharts option={maintenanceBar} style={{ height: 280 }} notMerge lazyUpdate /></Card>
        <Card title="Cost by Category (Treemap)"><ReactECharts option={costTreemap} style={{ height: 280 }} notMerge lazyUpdate /></Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Top 10 Highest Value Assets">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]"><th className="py-2 font-medium">Asset</th><th className="py-2 font-medium">Tag</th><th className="py-2 text-right font-medium">Book Value</th></tr></thead>
            <tbody>
              {analytics.topAssets.map((a) => (
                <tr key={a.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 text-[var(--text-primary)]">{a.name}</td>
                  <td className="py-2 font-mono text-xs text-[var(--text-secondary)]">{a.tag}</td>
                  <td className="py-2 text-right font-medium text-[var(--text-primary)]">{formatGBP(a.currentBookValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Assets Due for Replacement (≥ 80% life consumed)">
          {analytics.dueForReplacement.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-secondary)]">No assets currently due for replacement.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]"><th className="py-2 font-medium">Asset</th><th className="py-2 font-medium">Tag</th><th className="py-2 text-right font-medium">Life Used</th></tr></thead>
              <tbody>
                {analytics.dueForReplacement.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2 text-[var(--text-primary)]">{a.name}</td>
                    <td className="py-2 font-mono text-xs text-[var(--text-secondary)]">{a.tag}</td>
                    <td className="py-2 text-right font-medium text-[#d15914]">{a.lifeConsumedPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      {children}
    </div>
  );
}
