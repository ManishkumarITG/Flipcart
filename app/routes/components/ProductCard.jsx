import { Link } from "react-router";

const PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><rect width='100%' height='100%' fill='%23f1f3f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23a0a0a0' font-family='sans-serif' font-size='16'>No image</text></svg>";

function formatINR(value) {
  if (value == null || Number.isNaN(Number(value))) return "";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function ProductCard({ product }) {
  if (!product) return null;

  const price = Number(product.price) || 0;
  const discount = Number(product.discount) || 0;
  const hasDiscount = discount > 0 && discount < 100;
  const finalPrice = hasDiscount
    ? Math.round(price - (price * discount) / 100)
    : price;

  const mainImage = product.images?.[0]?.url || PLACEHOLDER;
  const rating = Number(product.rating) || 0;

  return (
    <Link
      to={`/product/${product._id}`}
      className="group flex flex-col rounded-md bg-white p-4 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
    >
      <div className="flex h-44 items-center justify-center overflow-hidden rounded bg-[#fafafa]">
        <img
          src={mainImage}
          alt={product.title}
          loading="lazy"
          className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
        />
      </div>

      <div className="mt-3 flex flex-col">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-gray-800 group-hover:text-flipkart-blue">
          {product.title}
        </h3>

        {rating > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-green-600 px-1.5 py-0.5 text-xs font-semibold text-white">
              {rating.toFixed(1)}
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.564-.955L10 0l2.946 5.955 6.564.955-4.755 4.635 1.123 6.545z" />
              </svg>
            </span>
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-base font-semibold text-gray-900">
            ₹{formatINR(finalPrice)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xs text-gray-500 line-through">
                ₹{formatINR(price)}
              </span>
              <span className="text-xs font-semibold text-green-700">
                {discount}% off
              </span>
            </>
          )}
        </div>

        <p className="mt-1 text-xs font-medium text-green-700">Free delivery</p>
      </div>
    </Link>
  );
}
