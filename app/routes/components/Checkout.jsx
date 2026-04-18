import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  clearCart,
  removeFromCart,
  selectCartItems,
  selectCartTotal,
  updateQuantity,
} from "./Redux/slices/cartSlice";

const PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='100%' height='100%' fill='%23f1f3f6'/></svg>";

function formatINR(value) {
  if (value == null || Number.isNaN(Number(value))) return "0";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function meta() {
  return [{ title: "Checkout - FlipCart" }];
}

export default function Checkout() {
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handlePlaceOrder = () => {
    if (!items.length) return;
    dispatch(clearCart());
    window.alert("Order placed! (demo)");
    navigate("/");
  };

  if (!items.length) {
    return (
      <div className="min-h-screen bg-[#f1f3f6]">
        <div className="mx-auto max-w-[900px] px-3 py-10 sm:px-4">
          <div className="rounded-md bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
            <h1 className="text-lg font-semibold text-gray-900">Your cart is empty</h1>
            <p className="mt-1 text-sm text-gray-500">
              Add products to start a checkout.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block rounded bg-flipkart-blue px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f63d3]"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-4 px-3 py-4 sm:px-4 sm:py-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-md bg-white shadow-sm ring-1 ring-gray-100">
          <div className="border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
            <h1 className="text-lg font-semibold text-gray-900">
              Review your order
            </h1>
          </div>

          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 px-4 py-4 sm:gap-4 sm:px-6"
              >
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded bg-[#fafafa]">
                  <img
                    src={item.image || PLACEHOLDER}
                    alt={item.title}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    to={`/product/${item.productId}`}
                    className="line-clamp-2 text-sm font-medium text-gray-800 hover:text-flipkart-blue"
                  >
                    {item.title}
                  </Link>
                  {item.variant && (
                    <p className="mt-1 text-xs text-gray-500">
                      {item.variant.name}: {item.variant.value}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center rounded border border-gray-300">
                      <button
                        type="button"
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              id: item.id,
                              quantity: item.quantity - 1,
                            }),
                          )
                        }
                        className="px-2 py-0.5 text-gray-700 hover:bg-gray-100"
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <span className="min-w-[2rem] px-2 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              id: item.id,
                              quantity: item.quantity + 1,
                            }),
                          )
                        }
                        className="px-2 py-0.5 text-gray-700 hover:bg-gray-100"
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => dispatch(removeFromCart(item.id))}
                      className="text-xs font-semibold text-gray-600 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <span className="text-sm font-semibold text-gray-900">
                    ₹{formatINR(item.finalPrice * item.quantity)}
                  </span>
                  {item.discount > 0 && item.discount < 100 && (
                    <span className="text-xs text-gray-500 line-through">
                      ₹{formatINR(item.price * item.quantity)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="h-fit rounded-md bg-white shadow-sm ring-1 ring-gray-100">
          <div className="border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Price details
            </h2>
          </div>
          <div className="space-y-2 px-4 py-4 text-sm sm:px-6">
            <div className="flex justify-between text-gray-700">
              <span>Items ({items.reduce((n, i) => n + i.quantity, 0)})</span>
              <span>₹{formatINR(total)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Delivery</span>
              <span className="text-green-700">Free</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-dashed border-gray-200 pt-3 text-base font-semibold text-gray-900">
              <span>Total</span>
              <span>₹{formatINR(total)}</span>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              className="mt-4 w-full rounded bg-[#fb641b] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#e95913]"
            >
              Place Order
            </button>
            <Link
              to="/"
              className="mt-2 block text-center text-xs font-semibold text-flipkart-blue hover:underline"
            >
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
