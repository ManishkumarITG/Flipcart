import { useEffect, useRef, useState } from "react";
import { API_SERVICES } from "../Services/Apis";

// Order-specific PhonePe Dynamic QR modal.
// Shows the QR, amount and an expiry countdown, then polls
// GET /api/payment/status/:orderId every few seconds until the payment
// reaches a terminal state (PAID / FAILED / EXPIRED).

const POLL_INTERVAL_MS = 4000;
const api = new API_SERVICES();

function formatINR(value) {
  if (value == null || Number.isNaN(Number(value))) return "0";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Number(value),
  );
}

function formatClock(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function PhonePeQrModal({ order, onClose, onPaid }) {
  const [status, setStatus] = useState(order?.status || "PENDING");
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!order?.expiresAt) return 0;
    return Math.max(0, Math.floor((new Date(order.expiresAt) - Date.now()) / 1000));
  });
  const pollRef = useRef(null);
  const tickRef = useRef(null);

  const isTerminal = (s) => s === "PAID" || s === "FAILED" || s === "EXPIRED" || s === "CANCELLED";

  // Poll payment status until a terminal state.
  useEffect(() => {
    if (!order?.orderId) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await api.getPaymentStatus(order.orderId);
        if (cancelled) return;
        const next = res?.data?.paymentStatus;
        if (next && next !== status) setStatus(next);
        if (next === "PAID") {
          if (typeof onPaid === "function") onPaid(res.data);
        }
      } catch {
        // transient network error — keep polling
      }
    }

    pollRef.current = window.setInterval(poll, POLL_INTERVAL_MS);
    poll(); // fire immediately

    return () => {
      cancelled = true;
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.orderId]);

  // Stop polling once we hit a terminal state.
  useEffect(() => {
    if (isTerminal(status) && pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [status]);

  // Countdown timer.
  useEffect(() => {
    tickRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(tickRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-flipkart-blue px-5 py-3 text-white">
          <span className="text-sm font-semibold">Pay with any UPI app</span>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-6 text-center">
          {status === "PAID" ? (
            <div className="py-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
                ✓
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Payment successful
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                ₹{formatINR(order.amount)} received for order {order.orderId}.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 w-full rounded bg-flipkart-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1f63d3]"
              >
                Done
              </button>
            </div>
          ) : status === "EXPIRED" || secondsLeft === 0 ? (
            <div className="py-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-700">
                ⏱
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">QR expired</h3>
              <p className="mt-1 text-sm text-gray-600">
                This QR is no longer valid. Please start the payment again.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 w-full rounded border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          ) : status === "FAILED" ? (
            <div className="py-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-700">
                ✕
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Payment failed</h3>
              <p className="mt-1 text-sm text-gray-600">
                The payment could not be completed. Please try again.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 w-full rounded border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900">₹{formatINR(order.amount)}</p>
              <p className="mt-0.5 text-xs text-gray-500">Order {order.orderId}</p>

              <div className="mt-4 flex justify-center">
                {order.phonepeQrImage ? (
                  <img
                    src={order.phonepeQrImage}
                    alt="Scan to pay"
                    className="h-56 w-56 rounded border border-gray-200 object-contain"
                  />
                ) : (
                  <div className="max-w-full break-all rounded border border-gray-200 p-3 text-left text-xs text-gray-600">
                    {/* Fallback: no rendered image — show the raw UPI/QR payload */}
                    {order.phonepeQrString || "QR unavailable"}
                  </div>
                )}
              </div>

              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-flipkart-blue">
                <span className="h-2 w-2 animate-pulse rounded-full bg-flipkart-blue" />
                Waiting for payment…
              </p>
              <p className="mt-3 text-xs text-gray-500">
                Scan with PhonePe / Google Pay / Paytm / any UPI app.
              </p>
              <p className="mt-1 text-xs font-semibold text-gray-700">
                Expires in {formatClock(secondsLeft)}
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-5 w-full rounded border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
