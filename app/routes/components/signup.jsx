import { useState } from "react";
import { Link, useNavigate  } from "react-router";
import { API_SERVICES } from "../Services/Apis";
import { isStrongPassword, validateEmail } from "../utils/validationMethods";
export function meta() {
  return [
    { title: "Sign Up - FlipCart" },
    { name: "description", content: "Create your FlipCart account" },
  ];
}

export default function Signup() {
  const navigate = useNavigate()
  const [responseData, setResponseData] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const apiClass = new API_SERVICES();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

  };

  const handleFocus = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name?.trim() || formData.name.trim().length < 2) {
      nextErrors.name = "Name must be at least 2 characters long.";
    }

    if (!formData.email?.trim()) {
      nextErrors.email = "Email is required";
    } else if (!validateEmail(formData.email).valid) {
      nextErrors.email = validateEmail(formData.email).message;
    }

    if (!formData.password) {
      nextErrors.password = "Password is required";
    } else if (!isStrongPassword(formData.password)) {
      nextErrors.password =
        "Password must be at least 8 characters long and contain both letters and numbers.";
    }

    return nextErrors;
  };

  const submitHadle = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    const res = await apiClass.sign_up(formData);
    setResponseData(res);
    console.log("Response from API:", res);
    if (res?.success) {
      navigate("/");
    }
  }


  return (
    <main className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="text-center mb-6">
            <Link to="/" className="inline-block">
              <span className="font-bold text-2xl text-flipkart-blue">
                Flip<span className="text-flipkart-yellow">Cart</span>
              </span>
            </Link>
            <p className="text-gray-600 text-sm mt-2">Create your FlipCart account</p>
          </div>
          <form onSubmit={submitHadle} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange(e)}
                onFocus={() => handleFocus("name")}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-flipkart-blue focus:border-flipkart-blue outline-none"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange(e)}
                onFocus={() => handleFocus("email")}
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-flipkart-blue focus:border-flipkart-blue outline-none"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange(e)}
                  onFocus={() => handleFocus("password")}
                  placeholder="Enter your password"
                  className="w-full rounded border border-gray-300 px-4 py-2.5 pr-11 outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-flipkart-blue"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.58 10.58a2 2 0 102.84 2.84" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.88 4.24A10.94 10.94 0 0112 4c5 0 9 4.5 10 8-0.35 1.22-1.03 2.52-2 3.73" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.1 6.1C4.28 7.38 2.92 9.18 2 12c1 3.5 5 8 10 8 1.73 0 3.34-.45 4.74-1.2" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-8 10-8 10 8 10 8-3.5 8-10 8-10-8-10-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <p className="text-xs text-gray-500">
              By continuing, you agree to FlipCart&apos;s{" "}
              <Link to="/terms" className="text-flipkart-blue hover:underline">Terms of Use</Link>
              {" "}and{" "}
              <Link to="/privacy" className="text-flipkart-blue hover:underline">Privacy Policy</Link>.
            </p>

            <button
              type="submit"
              className="w-full py-2.5 bg-flipkart-yellow text-flipkart-blue font-medium rounded hover:bg-yellow-400 transition-colors disabled:opacity-60"
            >
              Create Account
            </button>
          </form>
          {
            responseData && !responseData.success && (
              <p className={`mt-4 text-center ${responseData?.success ? "text-green-600" : "text-red-600"}`}>
                {responseData?.message}
              </p>
            )
          }
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <Link to="/login" className="text-flipkart-blue font-medium hover:underline">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
