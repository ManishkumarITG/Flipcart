import { Link, useLoaderData } from "react-router";
import { connectDB } from "../../../server/configs/db.server";
import { getAuthUserFromRequest } from "../../../server/middleware/auth.server";
import { getMyProducts } from "../../../server/service/product.service";

export function meta() {
  return [{ title: "Seller Dashboard | FlipCart" }];
}

export async function loader({ request }) {
  await connectDB();
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser?.userId) return { products: [] };

  const result = await getMyProducts({ userId: authUser.userId });
  return { products: Array.isArray(result) ? result : [] };
}

export default function MerchantDashboard() {
  const { products } = useLoaderData();

  const active = products.filter((p) => p.status === "active").length;
  const inactive = products.filter((p) => p.status === "inactive").length;
  const outOfStock = products.filter(
    (p) => p.status === "out_of_stock" || Number(p.stock) === 0
  ).length;
  const drafts = products.filter((p) => p.status === "draft").length;

  const cards = [
    { label: "Total Products", value: products.length, color: "bg-blue-50 text-flipkart-blue" },
    { label: "Active", value: active, color: "bg-green-50 text-green-700" },
    { label: "Out of Stock", value: outOfStock, color: "bg-amber-50 text-amber-700" },
    { label: "Inactive", value: inactive + drafts, color: "bg-gray-100 text-gray-700" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Dashboard</h1>
        <Link
          to="/merchant/add-product"
          className="rounded bg-flipkart-yellow px-4 py-2 text-sm font-semibold text-flipkart-blue hover:bg-[#f6de00]"
        >
          + Add Product
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-md p-4 ${card.color}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-md border border-gray-100 p-4 text-sm text-gray-600">
        Manage your catalog from <Link to="/merchant/products" className="font-semibold text-flipkart-blue hover:underline">My Products</Link>.
        Orders and customer details will appear under <Link to="/merchant/orders" className="font-semibold text-flipkart-blue hover:underline">Orders</Link>.
      </div>
    </div>
  );
}
