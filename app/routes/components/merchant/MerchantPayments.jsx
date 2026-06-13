import { useState } from "react";
import { useLoaderData } from "react-router";
import { connectDB } from "../../../server/configs/db.server";
import { getAuthUserFromRequest } from "../../../server/middleware/auth.server";
import {
  getPhonePeSettings,
  getMerchantPayments,
} from "../../../server/service/merchant.service";
import { API_SERVICES } from "../../Services/Apis";

const api = new API_SERVICES();

export function meta() {
  return [{ title: "Payments | FlipCart Seller" }];
}

const EMPTY_PAGE = { items: [], page: 1, limit: 10, total: 0, totalPages: 0, balance: 0 };

export async function loader({ request }) {
  await connectDB();
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser?.userId) return { settings: null, payments: EMPTY_PAGE };

  const [settings, payments] = await Promise.all([
    getPhonePeSettings({ userId: authUser.userId }),
    getMerchantPayments({ userId: authUser.userId, page: 1, limit: 10 }),
  ]);

  return {
    settings: typeof settings === "string" ? null : settings,
    payments: typeof payments === "string" ? EMPTY_PAGE : payments,
  };
}

function formatINR(value) {
  if (value == null || Number.isNaN(Number(value))) return "0";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value));
}

const STATUS_STYLES = {
  PAID: "bg-green-50 text-green-700",
  PENDING: "bg-amber-50 text-amber-700",
  FAILED: "bg-red-50 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export default function MerchantPayments() {
  const { settings, payments } = useLoaderData();

  const [form, setForm] = useState({
    phonepeMerchantId: settings?.phonepeMerchantId || "",
    phonepeStoreId: settings?.phonepeStoreId || "",
    phonepeTerminalId: settings?.phonepeTerminalId || "",
    phonepeProviderId: settings?.phonepeProviderId || "",
    paymentEnabled: Boolean(settings?.paymentEnabled),
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const [page, setPage] = useState(payments);
  const [loadingPage, setLoadingPage] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });
    setSaving(true);
    try {
      const res = await api.savePhonePeSettings(form);
      if (res?.success) {
        setFeedback({ type: "success", message: res.message || "Saved." });
      } else {
        setFeedback({ type: "error", message: res?.message || "Failed to save." });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  const loadPage = async (next) => {
    if (next < 1 || (page.totalPages && next > page.totalPages)) return;
    setLoadingPage(true);
    try {
      const res = await api.getMerchantPayments({ page: next, limit: page.limit });
      if (res?.success && res.data) setPage(res.data);
    } finally {
      setLoadingPage(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Payments</h1>

      {/* PhonePe setup */}
      <form
        onSubmit={handleSave}
        className="mt-6 rounded-md border border-gray-100 p-4 sm:p-6"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            PhonePe Payment Setup
          </h2>
          <span className="rounded bg-blue-50 px-3 py-1 text-xs font-semibold text-flipkart-blue">
            Balance: ₹{formatINR(page.balance ?? settings?.balance ?? 0)}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="PhonePe Merchant ID"
            name="phonepeMerchantId"
            value={form.phonepeMerchantId}
            onChange={onChange}
            placeholder="PGTESTPAYUAT"
            required
          />
          <Field
            label="Store ID"
            name="phonepeStoreId"
            value={form.phonepeStoreId}
            onChange={onChange}
            placeholder="STORE001"
            required
          />
          <Field
            label="Terminal ID"
            name="phonepeTerminalId"
            value={form.phonepeTerminalId}
            onChange={onChange}
            placeholder="TERMINAL001"
            required
          />
          <Field
            label="Provider ID (optional)"
            name="phonepeProviderId"
            value={form.phonepeProviderId}
            onChange={onChange}
            placeholder="Leave blank if not provided"
          />
        </div>

        <label className="mt-4 flex items-center gap-3 text-sm text-gray-700">
          <input
            type="checkbox"
            name="paymentEnabled"
            checked={form.paymentEnabled}
            onChange={onChange}
            className="h-4 w-4 accent-flipkart-blue"
          />
          Enable PhonePe payments for my store
        </label>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-flipkart-blue px-5 py-2 text-sm font-semibold text-white hover:bg-[#1f63d3] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
          {feedback.message && (
            <span
              className={`text-sm ${
                feedback.type === "success" ? "text-green-700" : "text-red-600"
              }`}
            >
              {feedback.message}
            </span>
          )}
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Your PhonePe salt key is configured securely on the server and is never
          entered or shown here.
        </p>
      </form>

      {/* Payment history */}
      <div className="mt-8 rounded-md border border-gray-100 p-4 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Payment History
        </h2>

        {page.items.length === 0 ? (
          <div className="rounded border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
            No payments yet.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                    <th className="py-2 pr-3">Order</th>
                    <th className="py-2 pr-3">Amount</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Txn ID</th>
                    <th className="py-2 pr-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((p) => (
                    <tr key={p.orderId} className="border-b border-gray-50">
                      <td className="py-2 pr-3 font-mono text-xs text-gray-700">
                        {p.orderId}
                      </td>
                      <td className="py-2 pr-3 font-semibold text-gray-900">
                        ₹{formatINR(p.amount)}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold ${
                            STATUS_STYLES[p.status] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs text-gray-500">
                        {p.phonepeTransactionId || "—"}
                      </td>
                      <td className="py-2 pr-3 text-xs text-gray-500">
                        {p.createdAt ? new Date(p.createdAt).toLocaleString("en-IN") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Page {page.page} of {page.totalPages || 1} · {page.total} total
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadPage(page.page - 1)}
                  disabled={loadingPage || page.page <= 1}
                  className="rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => loadPage(page.page + 1)}
                  disabled={loadingPage || page.page >= (page.totalPages || 1)}
                  className="rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}
