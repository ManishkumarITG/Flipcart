import { useMemo, useState } from "react";
import { Link, redirect, useLoaderData, useNavigate } from "react-router";
import { connectDB } from "../../../server/configs/db.server";
import { getAuthUserFromRequest } from "../../../server/middleware/auth.server";
import { getProductById } from "../../../server/service/product.service";
import { messages } from "../../../server/utils/constants/codes";
import { API_SERVICES } from "../../Services/Apis";

const categories = [
  "Mobiles", "Laptops", "Desktop PCs", "Cameras", "Headphones", "Smart Watches",
  "Speakers", "Power Banks", "Printers", "Monitors",
  "Televisions", "Air Conditioners", "Refrigerators", "Washing Machines",
  "Microwave Ovens", "Water Purifiers",
  "Men's Clothing", "Men's Footwear", "Women's Clothing", "Women's Footwear",
  "Watches", "Bags & Luggage", "Jewellery",
  "Furniture", "Kitchen Appliances", "Home Decor", "Lighting", "Mattresses",
  "Tools & Utility", "Toys", "School Supplies", "Baby Care",
  "Sports Equipment", "Books", "Musical Instruments", "Stationery", "Fitness",
  "Automotive Accessories", "Health & Personal Care", "Beauty & Grooming", "Grocery",
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
  { value: "out_of_stock", label: "Out of Stock" },
];

export function meta() {
  return [{ title: "Edit Product | FlipCart Seller" }];
}

export async function loader({ request, params }) {
  await connectDB();
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser?.userId) throw redirect("/login");

  const result = await getProductById({
    productId: params.id,
    userId: authUser.userId,
  });

  if (result === messages.NOT_FOUND) throw redirect("/merchant/products");
  if (result === messages.UNAUTHORIZED) throw redirect("/sell");
  if (typeof result === "string" || !result || !result._id) {
    throw new Response("Failed to load product", { status: 500 });
  }

  return { product: result };
}

function EditForm({ product }) {
  const navigate = useNavigate();
  const apiClass = useMemo(() => new API_SERVICES(), []);

  const [form, setForm] = useState({
    title: product?.title ?? "",
    description: product?.description ?? "",
    price: product?.price ?? "",
    discount: product?.discount ?? 0,
    stock: product?.stock ?? 0,
    category: product?.category ?? "",
    status: product?.status ?? "active",
  });
  const [keepImages, setKeepImages] = useState(
    (product?.images || []).map((img) => img.publicId)
  );
  const [newFiles, setNewFiles] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleKeep = (publicId) => {
    setKeepImages((prev) =>
      prev.includes(publicId)
        ? prev.filter((p) => p !== publicId)
        : [...prev, publicId]
    );
  };

  const handleNewFiles = (e) => {
    setNewFiles(Array.from(e.target.files || []));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) return setError("Title required.");
    if (!form.description.trim()) return setError("Description required.");
    if (!form.category) return setError("Category required.");
    if (!form.price || Number(form.price) <= 0) return setError("Valid price required.");
    if (Number(form.discount) < 0 || Number(form.discount) > 100) {
      return setError("Discount must be 0–100.");
    }
    if (Number(form.stock) < 0) return setError("Stock can't be negative.");

    const totalImagesAfter = keepImages.length + newFiles.length;
    if (totalImagesAfter === 0) {
      return setError("At least one image is required.");
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("id", product._id);
      payload.append("title", form.title.trim());
      payload.append("description", form.description.trim());
      payload.append("price", String(form.price));
      payload.append("discount", String(form.discount || 0));
      payload.append("stock", String(form.stock || 0));
      payload.append("category", form.category);
      payload.append("status", form.status);
      payload.append("keepImages", JSON.stringify(keepImages));
      newFiles.forEach((f) => payload.append("newImages", f));

      const res = await apiClass.updateProduct(payload);
      if (!res?.success) {
        setError(res?.message || "Failed to update product.");
        return;
      }
      navigate("/merchant/products");
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Edit Product</h1>
        <Link
          to="/merchant/products"
          className="text-sm font-semibold text-flipkart-blue hover:underline"
        >
          ← Back to products
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Price (₹)</label>
            <input
              type="number" min="0" name="price"
              value={form.price} onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Discount (%)</label>
            <input
              type="number" min="0" max="100" name="discount"
              value={form.discount} onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Stock</label>
            <input
              type="number" min="0" name="stock"
              value={form.stock} onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status" value={form.status} onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category" value={form.category} onChange={handleChange}
            className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Existing Images ({keepImages.length} kept)
          </label>
          {(product.images || []).length === 0 ? (
            <p className="text-sm text-gray-500">No images yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {product.images.map((img) => {
                const kept = keepImages.includes(img.publicId);
                return (
                  <div key={img.publicId} className="relative">
                    <img
                      src={img.url}
                      alt=""
                      className={`h-24 w-24 rounded border object-cover ${
                        kept ? "border-green-500" : "border-red-300 opacity-40"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => toggleKeep(img.publicId)}
                      className={`absolute -top-2 -right-2 rounded-full px-2 py-0.5 text-xs font-semibold text-white ${
                        kept ? "bg-red-600" : "bg-green-600"
                      }`}
                    >
                      {kept ? "Remove" : "Keep"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Add New Images</label>
          <input
            type="file" accept="image/*" multiple
            onChange={handleNewFiles}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-flipkart-blue hover:file:bg-blue-100"
          />
          {newFiles.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {newFiles.length} new file(s) selected
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <Link
            to="/merchant/products"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-flipkart-yellow px-5 py-2 text-sm font-semibold text-flipkart-blue hover:bg-[#f6de00] disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function MerchantProductEdit() {
  const { product } = useLoaderData();
  return <EditForm key={product?._id} product={product} />;
}
