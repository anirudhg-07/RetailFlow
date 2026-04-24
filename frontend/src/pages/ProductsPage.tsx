import { useEffect, useMemo, useState } from "react";

import { apiDelete, apiGet, apiPost } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProductRow = {
  product_id: number;
  product_name: string;
  category: string;
  price: string | number;
  quantity: number;
  supplier_id: number | null;
  supplier_name: string | null;
};

type ProductsListApi = { ok: boolean; products: ProductRow[] };
type SuppliersListApi = {
  ok: boolean;
  suppliers: Array<{ supplier_id: number; supplier_name: string }>;
};

export default function ProductsPage() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [suppliers, setSuppliers] = useState<SuppliersListApi["suppliers"]>([]);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    product_name: "",
    category: "",
    price: "",
    quantity: "",
    supplier_id: "",
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [p, s] = await Promise.all([
        apiGet<ProductsListApi>("/api/products"),
        apiGet<SuppliersListApi>("/api/suppliers"),
      ]);
  setRows(p.products || []);
  setSuppliers(s.suppliers || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = query
      ? rows.filter(
          (p) =>
            p.product_name.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query) ||
            (p.supplier_name || "").toLowerCase().includes(query),
        )
      : rows;
    return base;
  }, [q, rows]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function onCreate() {
    setError(null);
    try {
      await apiPost<{ ok: boolean; product_id: number }>("/api/products", {
        product_name: form.product_name.trim(),
        category: form.category.trim(),
        price: form.price === "" ? null : Number(form.price),
        quantity: form.quantity === "" ? null : Number(form.quantity),
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
      });
      setShowAdd(false);
      setForm({ product_name: "", category: "", price: "", quantity: "", supplier_id: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    setError(null);
    try {
      await apiDelete<{ ok: boolean }>(`/api/products/${id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Products</h1>
            <p className="mt-1 text-sm text-slate-600">Manage items, pricing, and stock levels.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void load()}>
              Refresh
            </Button>
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600"
              onClick={() => setShowAdd(true)}
            >
              Add product
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="font-medium">Action failed</div>
            <div className="mt-1 text-xs text-red-700">{error}</div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:max-w-sm">
                <Input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search products…"
                />
              </div>
              <div className="text-sm text-slate-600">
                {loading ? "Loading…" : `${filtered.length} products`}
              </div>
            </div>

            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {current.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-slate-500">
                        No products found.
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {current.map((p, idx) => (
                    <TableRow key={p.product_id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <TableCell>
                        <div className="font-medium text-slate-900">{p.product_name}</div>
                        <div className="mt-0.5 text-xs text-slate-500">#{p.product_id}</div>
                      </TableCell>
                      <TableCell className="text-slate-700">{p.category}</TableCell>
                      <TableCell className="text-right font-medium text-slate-900">₹{p.price}</TableCell>
                      <TableCell className="text-right font-medium text-slate-900">{p.quantity}</TableCell>
                      <TableCell className="text-slate-700">{p.supplier_name || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void onDelete(p.product_id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="text-xs text-slate-500">
                Page <span className="font-medium text-slate-700">{page}</span> of {pageCount}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Quick stats</div>
            <div className="mt-1 text-xs text-slate-500">At-a-glance inventory context</div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="text-slate-600">Total products</div>
                <div className="font-semibold text-slate-900">{rows.length}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-slate-600">Suppliers</div>
                <div className="font-semibold text-slate-900">{suppliers.length}</div>
              </div>
            </div>
          </div>
        </div>

        {showAdd ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Add product</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Create a new inventory item.</p>
                </div>
                <button
                  className="rounded-lg px-2 py-1 text-sm text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  onClick={() => setShowAdd(false)}
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4">
                <div>
                  <Label>Product name</Label>
                  <Input
                    value={form.product_name}
                    onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
                    placeholder="e.g. Laptop"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    placeholder="e.g. Electronics"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Price</Label>
                    <Input
                      inputMode="decimal"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="e.g. 999.99"
                    />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      inputMode="numeric"
                      value={form.quantity}
                      onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                      placeholder="e.g. 10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Supplier (optional)</Label>
                  <select
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm shadow-black/5 transition focus-visible:border-indigo-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-500/20"
                    value={form.supplier_id}
                    onChange={(e) => setForm((f) => ({ ...f, supplier_id: e.target.value }))}
                  >
                    <option value="">— None —</option>
                    {suppliers.map((s) => (
                      <option key={s.supplier_id} value={String(s.supplier_id)}>
                        {s.supplier_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAdd(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600"
                  onClick={() => void onCreate()}
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
