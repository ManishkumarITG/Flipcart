import { useState } from "react";
import { Link, useLoaderData, useRevalidator } from "react-router";
import { connectDB } from "../../../server/configs/db.server";
import { getAuthUserFromRequest } from "../../../server/middleware/auth.server";
import { getMyProducts } from "../../../server/service/product.service";
import { API_SERVICES } from "../../Services/Apis";

export function meta() {
  return [{ title: "My Products | FlipCart Seller" }];
}

export async function loader({ request }) {
  await connectDB();
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser?.userId) return { products: [] };
  const result = await getMyProducts({ userId: authUser.userId });
  return { products: Array.isArray(result) ? result : [] };
}

const statusStyle = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-700",
  draft: "bg-amber-100 text-amber-700",
  out_of_stock: "bg-red-100 text-red-700",
};

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );
}

export default function MerchantProducts() {
  const { products } = useLoaderData();
  const revalidator = useRevalidator();
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const apiClass = new API_SERVICES();

  const handleDelete = async (id) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeletingId(id);
    setError("");
    try {
      const res = await apiClass.deleteProduct(id);
      if (!res?.success) {
        setError(res?.message || "Failed to delete product.");
        return;
      }
      revalidator.revalidate();
    } catch (e) {
      console.error(e);
      setError("Failed to delete product.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">My Products</h1>
        <Link
          to="/merchant/add-product"
          className="rounded bg-flipkart-yellow px-4 py-2 text-sm font-semibold text-flipkart-blue hover:bg-[#f6de00]"
        >
          + Add Product
        </Link>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {products.length === 0 ? (
        <div className="rounded border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
          You haven't added any products yet.
          <div className="mt-3">
            <Link
              to="/merchant/add-product"
              className="inline-flex rounded bg-flipkart-blue px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f63d3]"
            >
              Add your first product
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Product</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Category</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Price</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Stock</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-600">Status</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {products.map((product) => (
                <tr key={product._id}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0]?.url || ""}
                        alt=""
                        className="h-10 w-10 rounded object-cover bg-gray-100"
                      />
                      <span className="line-clamp-1 max-w-[240px] font-medium text-gray-800">
                        {product.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{product.category}</td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    ₹{formatINR(product.price)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {product.stock ?? 0}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        statusStyle[product.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {product.status?.replace("_", " ") || "active"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/merchant/products/${product._id}/edit`}
                        className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(product._id)}
                        disabled={deletingId === product._id}
                        className="rounded border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === product._id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
