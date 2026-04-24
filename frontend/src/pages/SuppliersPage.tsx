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

type SupplierRow = {
  supplier_id: number;
  supplier_name: string;
  phone: string;
  email: string | null;
  address: string;
};

type SuppliersListApi = { ok: boolean; suppliers: SupplierRow[] };

export default function SuppliersPage() {
  const [rows, setRows] = useState<SupplierRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    supplier_name: "",
    phone: "",
    email: "",
    address: "",
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<SuppliersListApi>(
        `/api/suppliers${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`,
      );
  setRows(data.suppliers || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (s) =>
        s.supplier_name.toLowerCase().includes(query) ||
        s.phone.toLowerCase().includes(query) ||
        (s.email || "").toLowerCase().includes(query) ||
        s.address.toLowerCase().includes(query),
    );
  }, [q, rows]);

  async function onCreate() {
    setError(null);
    try {
      await apiPost<{ ok: boolean; supplier_id: number }>("/api/suppliers", {
        supplier_name: form.supplier_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim(),
      });
      setShowAdd(false);
      setForm({ supplier_name: "", phone: "", email: "", address: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this supplier?")) return;
    setError(null);
    try {
      await apiDelete<{ ok: boolean }>(`/api/suppliers/${id}`);
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
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Suppliers</h1>
            <p className="mt-1 text-sm text-slate-600">Manage supplier contact details.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void load()}>
              Refresh
            </Button>
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600"
              onClick={() => setShowAdd(true)}
            >
              Add supplier
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="font-medium">Action failed</div>
            <div className="mt-1 text-xs text-red-700">{error}</div>
          </div>
        ) : null}

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-sm">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search suppliers…" />
            </div>
            <div className="text-sm text-slate-600">{loading ? "Loading…" : `${filtered.length} suppliers`}</div>
          </div>

          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Supplier</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-slate-500">
                      No suppliers found.
                    </TableCell>
                  </TableRow>
                ) : null}

                {filtered.map((s, idx) => (
                  <TableRow key={s.supplier_id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{s.supplier_name}</div>
                      <div className="mt-0.5 text-xs text-slate-500">#{s.supplier_id}</div>
                    </TableCell>
                    <TableCell className="text-slate-700">{s.phone || "—"}</TableCell>
                    <TableCell className="text-slate-700">{s.email || "—"}</TableCell>
                    <TableCell className="text-slate-700">{s.address || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => void onDelete(s.supplier_id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {showAdd ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Add supplier</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Create a new vendor record.</p>
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
                  <Label>Supplier name</Label>
                  <Input
                    value={form.supplier_name}
                    onChange={(e) => setForm((f) => ({ ...f, supplier_name: e.target.value }))}
                    placeholder="e.g. ABC Traders"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="e.g. +91 98xxxx"
                  />
                </div>
                <div>
                  <Label>Email (optional)</Label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="name@company.com"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="City / Address"
                  />
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
