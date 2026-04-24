import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

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

type OrdersApi = {
  ok: boolean;
  orders: Array<{
    order_id: number;
    customer_name: string | null;
    order_date: string;
    total_amount: string;
  }>;
};

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardApi["kpis"] | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrdersApi["orders"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const dash = await apiGet<DashboardApi>("/api/dashboard");
        const orders = await apiGet<OrdersApi>("/api/orders");
        if (cancelled) return;
        setKpis(dash.kpis);
        setRecentOrders(orders.orders.slice(0, 8));
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

  const cards = useMemo(() => {
    return [
      {
        title: "Total Products",
        value: kpis?.total_products ?? "—",
      },
      {
        title: "Total Orders (Today)",
  value: kpis?.orders_today ?? "—",
      },
      {
        title: "Revenue (Today)",
        value: kpis ? `₹${kpis.revenue_today}` : "—",
      },
      {
        title: "Low Stock Items",
  value: kpis?.low_stock_count ?? "—",
      },
    ];
  }, [kpis]);

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Overview of inventory health and sales.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/products">View products</Link>
            </Button>
            <Button
              asChild
              className="bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600"
            >
              <Link to="/orders">View orders</Link>
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
            <div className="mt-2 text-xs text-red-700">
              Tip: set <code className="rounded bg-white px-1">VITE_API_BASE_URL</code> to your Flask
              server (default is http://127.0.0.1:5000).
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.title} className="border-indigo-100">
              <CardHeader>
                <CardTitle>{c.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-slate-900">{loading ? "…" : c.value}</div>
                <div className="mt-1 text-xs text-slate-500">Updated live from your database</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent orders</h2>
              <p className="mt-1 text-xs text-slate-500">Latest orders placed in the system</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/orders">Open orders</Link>
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-slate-500">
                    No orders yet. Create one from the Orders page.
                  </TableCell>
                </TableRow>
              ) : null}
              {recentOrders.map((o, idx) => (
                <TableRow key={o.order_id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <TableCell>#{o.order_id}</TableCell>
                  <TableCell>{o.customer_name || "—"}</TableCell>
                  <TableCell>{o.order_date}</TableCell>
                  <TableCell className="text-right">₹{o.total_amount}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
                      Placed
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
