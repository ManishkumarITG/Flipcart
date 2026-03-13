import { useMemo, useState } from "react";
import { Link, redirect, useLoaderData } from "react-router";

const categories = [
  // Electronics
  "Mobiles",
  "Laptops",
  "Desktop PCs",
  "Cameras",
  "Headphones",
  "Smart Watches",
  "Speakers",
  "Power Banks",
  "Printers",
  "Monitors",

  // Appliances
  "Televisions",
  "Air Conditioners",
  "Refrigerators",
  "Washing Machines",
  "Microwave Ovens",
  "Water Purifiers",

  // Fashion
  "Men's Clothing",
  "Men's Footwear",
  "Women's Clothing",
  "Women's Footwear",
  "Watches",
  "Bags & Luggage",
  "Jewellery",

  // Home
  "Furniture",
  "Kitchen Appliances",
  "Home Decor",
  "Lighting",
  "Mattresses",
  "Tools & Utility",

  // Kids
  "Toys",
  "School Supplies",
  "Baby Care",

  // Sports & Books
  "Sports Equipment",
  "Books",
  "Musical Instruments",
  "Stationery",
  "Fitness",

  // Automotive
  "Automotive Accessories",

  // Health & Beauty
  "Health & Personal Care",
  "Beauty & Grooming",

  // Grocery
  "Grocery"
];
const defaultVariant = () => ({
  id: Date.now() + Math.random(),
  name: "",
  value: "",
  images: [],
});

export function meta() {
  return [
    { title: "Add Product | FlipCart Seller" },
    { name: "description", content: "Add a product as a seller." },
  ];
}

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

export default function AddProductPage() {
  const data =  useLoaderData();
  console.log("data" , data);
  
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    discount: "",
    images: [],
    variants: [defaultVariant()],
  });

  const imageNames = useMemo(
    () => Array.from(formData.images || []).map((file) => file.name),
    [formData.images]
  );

  const handleBaseChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleProductImages = (e) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({ ...prev, images: files }));
    setErrors((prev) => ({ ...prev, images: "" }));
  };

  const handleVariantChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === id ? { ...variant, [field]: value } : variant
      ),
    }));
    setErrors((prev) => ({ ...prev, variants: "" }));
  };

  const handleVariantImages = (id, filesList) => {
    const files = Array.from(filesList || []);
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === id ? { ...variant, images: files } : variant
      ),
    }));
    setErrors((prev) => ({ ...prev, variants: "" }));
  };

  const addVariant = () => {
    setFormData((prev) => ({ ...prev, variants: [...prev.variants, defaultVariant()] }));
  };

  const removeVariant = (id) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.length > 1 ? prev.variants.filter((variant) => variant.id !== id) : prev.variants,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!formData.title.trim()) nextErrors.title = "Product title is required.";
    if (!formData.description.trim()) nextErrors.description = "Description is required.";
    if (!formData.price || Number(formData.price) <= 0) nextErrors.price = "Enter valid price.";
    if (!formData.category) nextErrors.category = "Please select category.";
    if (!formData.images?.length) nextErrors.images = "Please upload product images.";

    const hasInvalidVariant = formData.variants.some(
      (variant) => !variant.name.trim() || !variant.value.trim() || !variant.images?.length
    );
    if (hasInvalidVariant) {
      nextErrors.variants = "Each variant needs name, value and images.";
    }

    if (formData.discount && (Number(formData.discount) < 0 || Number(formData.discount) > 100)) {
      nextErrors.discount = "Discount must be between 0 and 100.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setShowSuccess(true);
  };

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#f1f3f6] px-4 py-10">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
          <p className="mt-1 text-sm text-gray-600">Fill all details to publish your product listing.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Product Title</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleBaseChange}
              placeholder="Enter product title"
              className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleBaseChange}
              rows={4}
              placeholder="Enter product description"
              className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Price</label>
              <input
                type="number"
                min="0"
                name="price"
                value={formData.price}
                onChange={handleBaseChange}
                placeholder="0"
                className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleBaseChange}
                className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                name="discount"
                value={formData.discount}
                onChange={handleBaseChange}
                placeholder="0"
                className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
              />
              {errors.discount && <p className="mt-1 text-sm text-red-600">{errors.discount}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Product Images (Multiple)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleProductImages}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-flipkart-blue hover:file:bg-blue-100"
            />
            {!!imageNames.length && (
              <p className="mt-2 text-xs text-gray-500">{imageNames.join(", ")}</p>
            )}
            {errors.images && <p className="mt-1 text-sm text-red-600">{errors.images}</p>}
          </div>

          <section className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Variants Data and Images</h2>
              <button
                type="button"
                onClick={addVariant}
                className="rounded bg-blue-50 px-3 py-1.5 text-xs font-semibold text-flipkart-blue hover:bg-blue-100"
              >
                Add Variant
              </button>
            </div>

            <div className="space-y-3">
              {formData.variants.map((variant, index) => (
                <div key={variant.id} className="rounded border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500">Variant {index + 1}</p>
                    {formData.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(variant.id)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={variant.name}
                      onChange={(e) => handleVariantChange(variant.id, "name", e.target.value)}
                      placeholder="Variant name (e.g. Color)"
                      className="rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      value={variant.value}
                      onChange={(e) => handleVariantChange(variant.id, "value", e.target.value)}
                      placeholder="Variant value (e.g. Black)"
                      className="rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleVariantImages(variant.id, e.target.files)}
                    className="mt-3 w-full rounded border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-flipkart-blue hover:file:bg-blue-100"
                  />
                </div>
              ))}
            </div>
            {errors.variants && <p className="mt-2 text-sm text-red-600">{errors.variants}</p>}
          </section>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link to="/" className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded bg-flipkart-yellow px-5 py-2 text-sm font-semibold text-flipkart-blue hover:bg-[#f6de00]"
            >
              Save Product
            </button>
          </div>
        </form>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
              &#10003;
            </div>
            <h3 className="mt-3 text-xl font-bold text-gray-900">Success</h3>
            <p className="mt-2 text-sm text-gray-600">Product added successfully.</p>
            <button
              type="button"
              onClick={() => setShowSuccess(false)}
              className="mt-4 rounded bg-flipkart-blue px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f63d3]"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
