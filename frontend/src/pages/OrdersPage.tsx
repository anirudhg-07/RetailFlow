import { useEffect, useMemo, useState } from "react";

import { apiGet, apiPost } from "@/api/client";
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

type ProductOption = {
  product_id: number;
  product_name: string;
  price: string | number;
  quantity: number;
};

type CustomerOption = {
  customer_id: number;
  customer_name: string;
  phone: string;
  email: string | null;
};

type ProductsListApi = { ok: boolean; products: ProductOption[] };
type CustomersListApi = { ok: boolean; customers: CustomerOption[] };

type OrderItem = {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
};

type CreateOrderResponse = { ok: boolean; order_id?: number; total_amount?: string; error?: string };

export default function OrdersPage() {
  const [customerId, setCustomerId] = useState<number | "">("");
  const [productId, setProductId] = useState<number | "">("");
  const [qty, setQty] = useState<number>(1);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [loadingRef, setLoadingRef] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [message, setMessage] = useState<{ tone: "info" | "success" | "error"; text: string } | null>(null);

  async function loadRefs() {
    setLoadingRef(true);
    setMessage(null);
    try {
      const [c, p] = await Promise.all([
        apiGet<CustomersListApi>("/api/customers"),
        apiGet<ProductsListApi>("/api/products"),
      ]);
      setCustomers(c.customers || []);
      setProducts(p.products || []);
    } catch (e) {
      setMessage({
        tone: "error",
        text: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoadingRef(false);
    }
  }

  useEffect(() => {
    void loadRefs();
  }, []);

  const total = useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.quantity, 0),
    [items],
  );

  const selectedProduct = useMemo(() => {
    if (productId === "") return null;
    return products.find((x) => x.product_id === productId) || null;
  }, [productId, products]);

  function addItem() {
    setMessage(null);
    if (productId === "") {
      setMessage({ tone: "info", text: "Choose a product to add." });
      return;
    }
    if (!qty || qty <= 0) {
      setMessage({ tone: "info", text: "Quantity must be greater than 0." });
      return;
    }
    const p = selectedProduct;
    if (!p) {
      setMessage({ tone: "error", text: "That product isn’t available. Please refresh." });
      return;
    }

    const unitPrice = typeof p.price === "string" ? Number(p.price) : p.price;

    setItems((prev) => {
      const existing = prev.find((x) => x.product_id === p.product_id);
      if (existing) {
        return prev.map((x) =>
          x.product_id === p.product_id ? { ...x, quantity: x.quantity + qty } : x,
        );
      }
      return [
        ...prev,
        {
          product_id: p.product_id,
          product_name: p.product_name,
          price: unitPrice,
          quantity: qty,
        },
      ];
    });

    setQty(1);
  }

  function removeItem(product_id: number) {
    setItems((prev) => prev.filter((x) => x.product_id !== product_id));
  }

  async function placeOrder() {
    setMessage(null);
    if (items.length === 0) {
  setMessage({ tone: "info", text: "Add at least one line item." });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_id: customerId === "" ? null : customerId,
        items: items.map((it) => ({ product_id: it.product_id, quantity: it.quantity })),
      };
      const res = await apiPost<CreateOrderResponse>("/api/orders", payload);
      if (!res.ok) {
        setMessage({ tone: "error", text: res.error || "Failed to place order." });
        return;
      }
      setMessage({
        tone: "success",
        text: `Order placed • #${res.order_id} • Total ₹${res.total_amount}`,
      });
      setItems([]);
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setSubmitting(false);
    }
  }

  function cancelOrder() {
    setMessage(null);
    setItems([]);
  }

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Orders</h1>
            <p className="mt-1 text-sm text-slate-600">Build an order, review totals, and place it securely.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <div className="text-xs text-slate-500">Order total</div>
              <div className="text-lg font-semibold tracking-tight text-slate-900">₹{total}</div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={cancelOrder}
              disabled={items.length === 0 && customerId === ""}
            >
              Clear
            </Button>
            <Button
              type="button"
              className="bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600"
              onClick={placeOrder}
              disabled={submitting || items.length === 0}
            >
              {submitting ? "Placing…" : "Place order"}
            </Button>
          </div>
        </div>

        {message ? (
          <div
            className={
              "mt-6 rounded-xl border p-4 text-sm shadow-sm " +
              (message.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : message.tone === "error"
                  ? "border-red-200 bg-red-50 text-red-900"
                  : "border-slate-200 bg-white text-slate-800")
            }
          >
            <div className="font-medium">
              {message.tone === "success" ? "Success" : message.tone === "error" ? "Something went wrong" : "Heads up"}
            </div>
            <div className="mt-1 text-xs opacity-90">{message.text}</div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Order builder</h2>
                <p className="mt-0.5 text-xs text-slate-500">Choose customer, add items, then place the order.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadRefs()}
                disabled={loadingRef || submitting}
              >
                {loadingRef ? "Refreshing…" : "Refresh"}
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <Label>Customer</Label>
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm shadow-black/5 transition focus-visible:border-indigo-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50"
                  value={customerId}
                  onChange={(e) =>
                    setCustomerId(e.target.value ? Number(e.target.value) : "")
                  }
                  disabled={loadingRef || submitting}
                >
                  <option value="">{loadingRef ? "Loading customers…" : "Select customer"}</option>
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.customer_name}
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-[11px] text-slate-500">Optional — you can place a walk-in order.</div>
              </div>

              <div>
                <Label>Product</Label>
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm shadow-black/5 transition focus-visible:border-indigo-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : "")}
                  disabled={loadingRef || submitting}
                >
                  <option value="">{loadingRef ? "Loading products…" : "Select product"}</option>
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_name} (₹{p.price})
                    </option>
                  ))}
                </select>
                {selectedProduct ? (
                  <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-medium text-slate-900">{selectedProduct.product_name}</div>
                      <div className="text-xs font-semibold text-slate-900">₹{selectedProduct.price}</div>
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      In stock: <span className="font-medium text-slate-700">{selectedProduct.quantity}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div>
                <Label>Quantity</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  disabled={submitting}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600"
                  onClick={addItem}
                  disabled={submitting || productId === ""}
                >
                  Add item
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQty(1)}
                  disabled={submitting}
                >
                  Reset qty
                </Button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">Current total</div>
                  <div className="text-base font-semibold tracking-tight text-slate-900">₹{total}</div>
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Taxes/discounts aren’t configured in this version.
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Line items</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Review quantities and remove items before placing.</p>
                </div>
                <div className="text-sm font-medium text-slate-700">
                  Total: <span className="font-semibold text-slate-900">₹{total}</span>
                </div>
              </div>

              <div className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 && !submitting ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center">
                          <div className="text-sm font-medium text-slate-900">No items yet</div>
                          <div className="mt-1 text-xs text-slate-500">
                            Add a product on the left to start building an order.
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {items.map((it, idx) => (
                      <TableRow
                        key={it.product_id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                      >
                        <TableCell>
                          <div className="font-medium text-slate-900">{it.product_name}</div>
                          <div className="mt-0.5 text-xs text-slate-500">#{it.product_id}</div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-900">{it.quantity}</TableCell>
                        <TableCell className="text-right text-slate-700">₹{it.price}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">₹{it.price * it.quantity}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="destructive" size="sm" onClick={() => removeItem(it.product_id)}>
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Button type="button" variant="outline" onClick={cancelOrder}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600"
                  onClick={placeOrder}
                  disabled={submitting || items.length === 0}
                >
                  {submitting ? "Placing…" : "Place order"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
