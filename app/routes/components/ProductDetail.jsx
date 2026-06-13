import { useMemo, useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { connectDB } from "../../server/configs/db.server";
import { getPublicProductById } from "../../server/service/product.service";
import { messages } from "../../server/utils/constants/codes";
import { addToCart } from "./Redux/slices/cartSlice";
import { API_SERVICES } from "../Services/Apis";
import PhonePeQrModal from "./PhonePeQrModal";

const api = new API_SERVICES();

const PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><rect width='100%' height='100%' fill='%23f1f3f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23a0a0a0' font-family='sans-serif' font-size='22'>No image</text></svg>";

function formatINR(value) {
  if (value == null || Number.isNaN(Number(value))) return "";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function meta({ data }) {
  const title = data?.product?.title || "Product";
  return [
    { title: `${title} - FlipCart` },
    { name: "description", content: data?.product?.description?.slice(0, 160) || "" },
  ];
}

export async function loader({ params }) {
  await connectDB();
  const result = await getPublicProductById(params.id);

  if (result === messages.NOT_FOUND || result === messages.BAD_REQUEST) {
    throw new Response("Product not found", { status: 404 });
  }
  if (result === messages.INTERNAL_SERVER_ERROR) {
    throw new Response("Something went wrong", { status: 500 });
  }

  return { product: JSON.parse(JSON.stringify(result)) };
}

export default function ProductDetail() {
  const { product } = useLoaderData();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const variants = product.variants || [];
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(
    variants.length ? 0 : -1,
  );
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [flash, setFlash] = useState("");
  const [qrOrder, setQrOrder] = useState(null);
  const [paying, setPaying] = useState(false);

  const activeVariant =
    selectedVariantIdx >= 0 ? variants[selectedVariantIdx] : null;

  const images = useMemo(() => {
    const fromVariant = activeVariant?.images?.length ? activeVariant.images : null;
    const base = fromVariant || product.images || [];
    return base.length ? base : [{ url: PLACEHOLDER, publicId: "placeholder" }];
  }, [activeVariant, product.images]);

  const price = Number(product.price) || 0;
  const discount = Number(product.discount) || 0;
  const hasDiscount = discount > 0 && discount < 100;
  const finalPrice = hasDiscount
    ? Math.round(price - (price * discount) / 100)
    : price;

  const inStock = product.status !== "out_of_stock" && product.stock !== 0;
  const stockCap = Number(product.stock) > 0 ? Number(product.stock) : 10;

  const showFlash = (msg) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(""), 2000);
  };

  const buildPayload = () => ({
    product,
    quantity,
    variant: activeVariant
      ? { name: activeVariant.name, value: activeVariant.value }
      : null,
  });

  const handleAddToCart = () => {
    if (!inStock) return;
    dispatch(addToCart(buildPayload()));
    showFlash("Added to cart");
  };

  // Buy Now -> create an order-specific PhonePe Dynamic QR and open the modal.
  const handleBuyNow = async () => {
    if (!inStock || paying) return;
    setPaying(true);
    try {
      const res = await api.createPaymentQr([
        {
          productId: product._id,
          quantity,
          variant: activeVariant
            ? { name: activeVariant.name, value: activeVariant.value }
            : null,
        },
      ]);
      if (res?.success && res.data) {
        setQrOrder(res.data);
      } else {
        showFlash(res?.message || "Could not start payment.");
      }
    } catch {
      showFlash("Could not start payment. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <div className="mx-auto max-w-[1400px] px-3 py-4 sm:px-4 sm:py-6">
        <nav className="mb-3 text-xs text-gray-500">
          <Link to="/" className="hover:text-flipkart-blue">
            Home
          </Link>
          <span className="mx-1">/</span>
          <span className="text-gray-700">{product.category}</span>
          <span className="mx-1">/</span>
          <span className="text-gray-700 line-clamp-1">{product.title}</span>
        </nav>

        <div className="rounded-md bg-white shadow-sm ring-1 ring-gray-100">
          <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 md:grid-cols-[1fr_1.2fr]">
            <div>
              <div className="flex h-80 items-center justify-center overflow-hidden rounded bg-[#fafafa] sm:h-96">
                <img
                  src={images[activeImageIdx]?.url || PLACEHOLDER}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {images.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={img.publicId || idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`h-16 w-16 overflow-hidden rounded border bg-white p-1 transition ${
                        activeImageIdx === idx
                          ? "border-flipkart-blue ring-1 ring-flipkart-blue"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="flex-1 rounded bg-[#ff9f00] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#f09000] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={!inStock || paying}
                  className="flex-1 rounded bg-[#fb641b] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#e95913] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                >
                  {paying ? "Starting…" : "Buy Now"}
                </button>
              </div>

              {flash && (
                <div className="mt-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {flash}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">
                {product.title}
              </h1>
              <p className="mt-1 text-xs text-gray-500">
                {product.category}
                {product.Merchent?.shopName && (
                  <span> · Sold by {product.Merchent.shopName}</span>
                )}
              </p>

              {Number(product.rating) > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-green-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                    {Number(product.rating).toFixed(1)}
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.564-.955L10 0l2.946 5.955 6.564.955-4.755 4.635 1.123 6.545z" />
                    </svg>
                  </span>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-semibold text-gray-900">
                  ₹{formatINR(finalPrice)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-sm text-gray-500 line-through">
                      ₹{formatINR(price)}
                    </span>
                    <span className="text-sm font-semibold text-green-700">
                      {discount}% off
                    </span>
                  </>
                )}
              </div>

              <p
                className={`mt-1 text-xs font-medium ${
                  inStock ? "text-green-700" : "text-red-600"
                }`}
              >
                {inStock ? "In stock · Free delivery" : "Out of stock"}
              </p>

              {variants.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-sm font-semibold text-gray-800">
                    {variants[0].name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v, idx) => (
                      <button
                        key={`${v.name}-${v.value}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedVariantIdx(idx);
                          setActiveImageIdx(0);
                        }}
                        className={`rounded border px-3 py-1.5 text-sm transition ${
                          selectedVariantIdx === idx
                            ? "border-flipkart-blue bg-blue-50 text-flipkart-blue"
                            : "border-gray-300 text-gray-700 hover:border-gray-500"
                        }`}
                      >
                        {v.value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Quantity
                </label>
                <div className="inline-flex items-center rounded border border-gray-300">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1 text-lg text-gray-700 hover:bg-gray-100"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="min-w-[2.5rem] px-3 text-center text-sm">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(stockCap, q + 1))}
                    className="px-3 py-1 text-lg text-gray-700 hover:bg-gray-100"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-4">
                <h2 className="text-sm font-semibold text-gray-900">Description</h2>
                <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
                  {product.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {qrOrder && (
        <PhonePeQrModal
          order={qrOrder}
          onClose={() => setQrOrder(null)}
          onPaid={() => showFlash("Payment successful!")}
        />
      )}
    </div>
  );
}
