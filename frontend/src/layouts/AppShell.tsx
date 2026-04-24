import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";

function SidebarLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500",
          isActive
            ? "bg-white/10 text-white shadow-sm"
            : "text-slate-200 hover:bg-white/5 hover:text-white",
        ].join(" ")
      }
      end
    >
      <span className="text-slate-300">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-800/50 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold tracking-tight text-white">RetailFlow</div>
              <div className="text-xs text-slate-300">Inventory &amp; Sales</div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs font-medium text-slate-300">Account</div>
            <div className="mt-1 text-sm font-medium text-white">Demo User</div>
            <div className="text-xs text-slate-300">demo@retailflow.local</div>
          </div>

          <nav className="mt-6 space-y-1">
            <SidebarLink to="/" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
            <SidebarLink to="/products" icon={<Package className="h-4 w-4" />} label="Products" />
            <SidebarLink to="/suppliers" icon={<Truck className="h-4 w-4" />} label="Suppliers" />
            <SidebarLink to="/customers" icon={<Users className="h-4 w-4" />} label="Customers" />
            <SidebarLink to="/orders" icon={<ShoppingCart className="h-4 w-4" />} label="Orders" />
            <SidebarLink to="/reports" icon={<BarChart3 className="h-4 w-4" />} label="Reports" />
          </nav>

          <div className="mt-6 border-t border-white/10 pt-4">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-200 transition hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              onClick={() => alert("Logout (wire to auth later)")}
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </aside>

        <div className="min-h-screen">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="text-sm font-semibold text-slate-900">Dashboard</div>
              <div className="flex items-center gap-2">
                <div className="hidden text-xs text-slate-500 sm:block">24 Apr 2026</div>
              </div>
            </div>
          </header>

          <main className="min-h-[calc(100vh-3.5rem)]">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
