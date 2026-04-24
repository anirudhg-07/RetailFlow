import { useEffect, useMemo, useState } from "react";

import { apiGet } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DashboardApi = {
  ok: boolean;
  kpis: {
    total_products: number;
  low_stock_count: number;
  orders_today: number;
    revenue_today: string;
  orders_month: number;
    revenue_month: string;
  };
};

type TopProductsApi = {
  ok: boolean;
  results: Array<{
    product_id: number;
    product_name: string;
    category: string;
    total_qty_sold: string | number;
    total_revenue: string;
  }>;
};

type LowStockApi = {
  ok: boolean;
  results: Array<{
    product_id: number;
    product_name: string;
    category: string;
    price: string | number;
    quantity: number;
    supplier_id: number | null;
  }>;
  threshold: number;
};

export default function ReportsPage() {
  const [dash, setDash] = useState<DashboardApi["kpis"] | null>(null);
  const [top, setTop] = useState<TopProductsApi["results"]>([]);
  const [low, setLow] = useState<LowStockApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasData = useMemo(() => {
    return Boolean(dash) || top.length > 0 || (low?.results?.length || 0) > 0;
  }, [dash, low?.results?.length, top.length]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const d = await apiGet<DashboardApi>("/api/dashboard");
        const t = await apiGet<TopProductsApi>("/api/reports/top-products?limit=10");
        const l = await apiGet<LowStockApi>("/api/reports/low-stock");
        if (cancelled) return;
        setDash(d.kpis);
        setTop(t.results);
        setLow(l);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reports</h1>
            <p className="mt-1 text-sm text-slate-600">
              Sales analytics and inventory insights for smarter decisions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                window.location.reload();
              }}
            >
              Refresh
            </Button>
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600"
              onClick={() => {
                const lines = [
                  "RetailFlow Reports",
                  "",
                  `Revenue (month): ₹${dash?.revenue_month ?? "—"}`,
                  `Orders (month): ${dash?.orders_month ?? "—"}`,
                  `Low stock (≤ ${low?.threshold ?? 5}): ${dash?.low_stock_count ?? "—"}`,
                ];
                void navigator.clipboard?.writeText(lines.join("\n"));
              }}
            >
              Copy summary
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="font-medium">Couldn’t load reports</div>
            <div className="mt-1 text-xs text-red-700">{error}</div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-indigo-100">
            <CardHeader>
              <CardTitle>Total Sales (Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-slate-900">
                {dash ? `₹${dash.revenue_month}` : loading ? "…" : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">Gross revenue this month</div>
            </CardContent>
          </Card>

          <Card className="border-indigo-100">
            <CardHeader>
              <CardTitle>Total Orders (Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-slate-900">
                {dash ? dash.orders_month : loading ? "…" : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">Orders created this month</div>
            </CardContent>
          </Card>

          <Card className="border-indigo-100">
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-slate-900">
                {dash ? dash.low_stock_count : loading ? "…" : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Threshold: ≤ {low?.threshold ?? 5}
              </div>
            </CardContent>
          </Card>
        </div>

        {!loading && !error && !hasData ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-sm font-medium text-slate-900">No report data yet</div>
            <div className="mt-1 text-sm text-slate-600">
              Create your first order to start seeing sales and low stock insights.
            </div>
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <div className="text-sm font-semibold text-slate-900">Top selling products</div>
                <div className="mt-1 text-xs text-slate-500">By quantity sold (last 10)</div>
              </div>
            </CardHeader>
            <CardContent className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="px-4">Product</TableHead>
                    <TableHead className="px-4 text-right">Qty Sold</TableHead>
                    <TableHead className="px-4 text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top.length === 0 ? (
                    <TableRow>
                      <TableCell className="px-4 py-8 text-center text-sm text-slate-500" colSpan={3}>
                        {loading ? "Loading…" : "No sales yet"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    top.map((p, idx) => (
                      <TableRow
                        key={p.product_id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                      >
                        <TableCell className="px-4">
                          <div className="font-medium text-slate-900">{p.product_name}</div>
                          <div className="mt-0.5 text-xs text-slate-500">{p.category}</div>
                        </TableCell>
                        <TableCell className="px-4 text-right font-medium text-slate-900">
                          {p.total_qty_sold}
                        </TableCell>
                        <TableCell className="px-4 text-right font-medium text-slate-900">
                          ₹{p.total_revenue}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <div className="text-sm font-semibold text-slate-900">Low stock products</div>
                <div className="mt-1 text-xs text-slate-500">Items with stock ≤ {low?.threshold ?? 5}</div>
              </div>
            </CardHeader>
            <CardContent className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="px-4">Product</TableHead>
                    <TableHead className="px-4 text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(low?.results || []).length === 0 ? (
                    <TableRow>
                      <TableCell className="px-4 py-8 text-center text-sm text-slate-500" colSpan={2}>
                        {loading ? "Loading…" : "All good — no low stock items"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (low?.results || []).map((p, idx) => (
                      <TableRow
                        key={p.product_id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                      >
                        <TableCell className="px-4">
                          <div className="font-medium text-slate-900">{p.product_name}</div>
                          <div className="mt-0.5 text-xs text-slate-500">{p.category}</div>
                        </TableCell>
                        <TableCell className="px-4 text-right font-medium text-slate-900">
                          {p.quantity}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
