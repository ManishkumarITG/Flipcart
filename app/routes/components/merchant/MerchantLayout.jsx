import { NavLink, Outlet, redirect, useLoaderData } from "react-router";

export async function loader({ request }) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const isMerchant = cookieHeader
    .split(";")
    .some((cookie) => cookie.trim().startsWith("merchant="));

  if (!isMerchant) {
    throw redirect("/sell");
  }

  return { isMerchant };
}

const navItems = [
  { to: "/merchant", label: "Dashboard", end: true },
  { to: "/merchant/products", label: "My Products" },
  { to: "/merchant/add-product", label: "Add Product" },
  { to: "/merchant/orders", label: "Orders" },
];

export default function MerchantLayout() {
  useLoaderData();

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#f1f3f6]">
      <div className="mx-auto grid max-w-[1400px] gap-4 px-3 py-4 sm:px-4 sm:py-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-md bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Seller Hub
          </p>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-flipkart-blue text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <section className="rounded-md bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-6">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
