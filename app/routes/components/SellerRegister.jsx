import { useMemo, useState } from "react";
import { Link, useLoaderData, useNavigate, useRevalidator } from "react-router";
import { API_SERVICES } from "../Services/Apis";

const countries = [
  "India",
  "United Arab Emirates",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "Singapore",
];

export function meta() {
  return [
    { title: "Register as Seller | FlipCart" },
    { name: "description", content: "Complete seller onboarding in 3 steps." },
  ];
}

export async function loader({ request }) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const isAuthenticated = cookieHeader
    .split(";")
    .some((cookie) => cookie.trim().startsWith("token="));

  return { isAuthenticated };
}

export default function SellerRegisterPage() {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const apiClass = new API_SERVICES();
  const { isAuthenticated } = useLoaderData();
  const [step, setStep] = useState(isAuthenticated ? 2 : 1);
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    gstNo: "",
    brandName: "",
    headOfficeAddress: "",
    ownerName: "",
    ownerNumber: "",
    sellingCountries: [],
    // PhonePe payment details (collected in step 3, editable later in Seller Hub → Payments)
    paymentEnabled: false,
    phonepeMerchantId: "",
    phonepeStoreId: "",
    phonepeTerminalId: "",
    phonepeProviderId: "",
  });

  const progress = useMemo(() => `${Math.min(step, 3)} / 3`, [step]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const toggleCountry = (country) => {
    setForm((prev) => {
      const selected = prev.sellingCountries.includes(country)
        ? prev.sellingCountries.filter((c) => c !== country)
        : [...prev.sellingCountries, country];
      return { ...prev, sellingCountries: selected };
    });
    setErrors((prev) => ({ ...prev, sellingCountries: "" }));
  };

  const nextStep = async () => {
    const nextErrors = {};

    if (step === 1 && !isAuthenticated) {
      nextErrors.step1 = "User registration is required before seller onboarding.";
    }

    if (step === 2) {
      if (!form.gstNo.trim()) nextErrors.gstNo = "GST number is required.";
      if (!form.brandName.trim()) nextErrors.brandName = "Brand name is required.";
      if (!form.headOfficeAddress.trim()) nextErrors.headOfficeAddress = "Head office address is required.";
      if (!form.ownerName.trim()) nextErrors.ownerName = "Owner name is required.";
      if (!form.ownerNumber.trim()) {
        nextErrors.ownerNumber = "Owner number is required.";
      } else if (!/^[0-9]{10}$/.test(form.ownerNumber.trim())) {
        nextErrors.ownerNumber = "Owner number must be 10 digits.";
      }
    }

    if (step === 3) {
      if (form.sellingCountries.length === 0) {
        nextErrors.sellingCountries = "Select at least one country.";
      }
      // PhonePe fields are optional, but if payments are enabled the core
      // identifiers must be present (they can also be set later from the
      // Seller Hub → Payments page).
      if (form.paymentEnabled) {
        if (!form.phonepeMerchantId.trim())
          nextErrors.phonepeMerchantId = "Merchant ID is required to enable payments.";
        if (!form.phonepeStoreId.trim())
          nextErrors.phonepeStoreId = "Store ID is required to enable payments.";
        if (!form.phonepeTerminalId.trim())
          nextErrors.phonepeTerminalId = "Terminal ID is required to enable payments.";
      }
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    if (step < 3) {
      setStep((prev) => prev + 1);
      return;
    }
    setIsSubmitting(true);
    
    try {
      const res = await apiClass.createMerchant({
        Brand: form.brandName,
        GST_NO: form.gstNo,
        HeadOfficeAddress: form.headOfficeAddress,
        OwnerName: form.ownerName,
        OwnerPhone: form.ownerNumber,
        prefaredCOuntries: form.sellingCountries,
        // PhonePe payment details (optional at onboarding).
        paymentEnabled: form.paymentEnabled,
        phonepeMerchantId: form.phonepeMerchantId,
        phonepeStoreId: form.phonepeStoreId,
        phonepeTerminalId: form.phonepeTerminalId,
        phonepeProviderId: form.phonepeProviderId,
      });
      
      if (!res?.success) {
        setErrors((prev) => ({
          ...prev,
          api: res?.message || "Failed to create seller account.",
        }));
        return;
      }

      revalidator.revalidate();
      setDone(true);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        api: "Failed to create seller account. Please try again.",
      }));
      console.log("Error to create a merchecnt -----------", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevStep = () => {
    setErrors({});
    setStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#f1f3f6] px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="rounded-t-xl bg-flipkart-blue px-6 py-5 text-white">
          <p className="text-sm font-medium text-white/80">Seller Onboarding</p>
          <h1 className="mt-1 text-2xl font-bold">Register as Seller</h1>
          <p className="mt-2 text-sm text-white/90">Complete all 3 steps to start selling on FlipCart.</p>
          <p className="mt-3 inline-block rounded bg-white/15 px-3 py-1 text-xs font-semibold">{progress}</p>
        </div>

        {done ? (
          <section className="px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
              &#10003;
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Done!</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-gray-600">
              Seller registration is completed. Your account will be reviewed shortly.
            </p>
            <div className="mx-auto mt-6 max-w-xl rounded-lg border border-green-200 bg-green-50 p-4 text-left">
              <p className="flex items-start gap-2 text-sm font-semibold text-green-800">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                  &#10003;
                </span>
                <span>Create Account</span>
              </p>
              <p className="mt-1 text-sm text-green-700">
                Register with your GST and pickup details in just a few clicks.
              </p>
            </div>
            <Link
              to="/"
              className="mt-6 inline-flex rounded-md bg-flipkart-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1f63d3]"
            >
              Go to Home
            </Link>
          </section>
        ) : (
          <section className="px-6 py-8">
            {step === 1 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Step 1: User Registration</h2>
                <p className="mt-1 text-sm text-gray-600">
                  You must register as a FlipCart user before continuing.
                </p>

                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Registration is mandatory for seller onboarding.
                </div>

                <Link
                  to="/signup"
                  className="mt-4 inline-flex rounded-md bg-flipkart-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1f63d3]"
                >
                  Register Yourself
                </Link>
                {errors.step1 && <p className="mt-2 text-sm text-red-600">{errors.step1}</p>}
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Step 2: Business Details</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Add your seller profile details.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-sm font-medium text-gray-700">GST No</label>
                    <input
                      name="gstNo"
                      value={form.gstNo}
                      onChange={handleChange}
                      placeholder="22AAAAA0000A1Z5"
                      className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
                    />
                    {errors.gstNo && <p className="mt-1 text-sm text-red-600">{errors.gstNo}</p>}
                  </div>

                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Brand Name</label>
                    <input
                      name="brandName"
                      value={form.brandName}
                      onChange={handleChange}
                      placeholder="Your Brand"
                      className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
                    />
                    {errors.brandName && <p className="mt-1 text-sm text-red-600">{errors.brandName}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Head Office Address</label>
                    <textarea
                      name="headOfficeAddress"
                      value={form.headOfficeAddress}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Head office full address"
                      className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
                    />
                    {errors.headOfficeAddress && (
                      <p className="mt-1 text-sm text-red-600">{errors.headOfficeAddress}</p>
                    )}
                  </div>

                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Owner Name</label>
                    <input
                      name="ownerName"
                      value={form.ownerName}
                      onChange={handleChange}
                      placeholder="Owner full name"
                      className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
                    />
                    {errors.ownerName && <p className="mt-1 text-sm text-red-600">{errors.ownerName}</p>}
                  </div>

                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Owner Number</label>
                    <input
                      name="ownerNumber"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.ownerNumber}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
                    />
                    {errors.ownerNumber && <p className="mt-1 text-sm text-red-600">{errors.ownerNumber}</p>}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Step 3: Selling Countries</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Select countries where you want to sell products.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {countries.map((country) => (
                    <label
                      key={country}
                      className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={form.sellingCountries.includes(country)}
                        onChange={() => toggleCountry(country)}
                        className="h-4 w-4 accent-flipkart-blue"
                      />
                      {country}
                    </label>
                  ))}
                </div>
                {errors.sellingCountries && <p className="mt-2 text-sm text-red-600">{errors.sellingCountries}</p>}

                {/* PhonePe payment information */}
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h3 className="text-base font-semibold text-gray-900">
                    Payment Information (PhonePe)
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Add your PhonePe details to accept UPI payments. You can skip
                    this now and set it up later from your seller dashboard.
                  </p>

                  <label className="mt-4 flex items-center gap-3 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      name="paymentEnabled"
                      checked={form.paymentEnabled}
                      onChange={handleChange}
                      className="h-4 w-4 accent-flipkart-blue"
                    />
                    Enable PhonePe payments for my store
                  </label>

                  {form.paymentEnabled && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          PhonePe Merchant ID
                        </label>
                        <input
                          name="phonepeMerchantId"
                          value={form.phonepeMerchantId}
                          onChange={handleChange}
                          placeholder="PGTESTPAYUAT"
                          className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
                        />
                        {errors.phonepeMerchantId && (
                          <p className="mt-1 text-sm text-red-600">{errors.phonepeMerchantId}</p>
                        )}
                      </div>

                      <div className="sm:col-span-1">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Store ID
                        </label>
                        <input
                          name="phonepeStoreId"
                          value={form.phonepeStoreId}
                          onChange={handleChange}
                          placeholder="STORE001"
                          className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
                        />
                        {errors.phonepeStoreId && (
                          <p className="mt-1 text-sm text-red-600">{errors.phonepeStoreId}</p>
                        )}
                      </div>

                      <div className="sm:col-span-1">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Terminal ID
                        </label>
                        <input
                          name="phonepeTerminalId"
                          value={form.phonepeTerminalId}
                          onChange={handleChange}
                          placeholder="TERMINAL001"
                          className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
                        />
                        {errors.phonepeTerminalId && (
                          <p className="mt-1 text-sm text-red-600">{errors.phonepeTerminalId}</p>
                        )}
                      </div>

                      <div className="sm:col-span-1">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Provider ID (optional)
                        </label>
                        <input
                          name="phonepeProviderId"
                          value={form.phonepeProviderId}
                          onChange={handleChange}
                          placeholder="Leave blank if not provided"
                          className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <p className="sm:col-span-2 text-xs text-gray-400">
                        Your PhonePe salt key stays securely on the server and is
                        never entered here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1 || (isAuthenticated && step === 2)}
                className="rounded border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>
              {!(step === 1 && !isAuthenticated) && (
                <div className="flex gap-[10px]">
                  <button onClick={() => { navigate("/"); }} className="rounded px-6 py-2.5 text-sm font-semibold text-flipkart-blue bg-[#f1f3f6]">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={isSubmitting}
                    className="rounded bg-flipkart-yellow px-6 py-2.5 text-sm font-semibold text-flipkart-blue hover:bg-[#f6de00]"
                  >
                    {step < 3 ? "Continue" : isSubmitting ? "Please wait..." : "Done"}
                  </button>
                </div>
              )}
            </div>
            {errors.api && <p className="mt-3 text-sm text-red-600">{errors.api}</p>}
          </section>
        )}
      </div>
    </main>
  );
}
