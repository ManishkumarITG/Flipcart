import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { API_SERVICES } from "../Services/Apis";
import { validateEmail } from "../utils/validationMethods";
import { loginUser } from "./Redux/slices/userSlice";
import { useDispatch } from "react-redux";
export function meta() {
  return [
    { title: "Login - FlipCart" },
    { name: "description", content: "Login to your FlipCart account" },
  ];
}

export default function Login() {
  const navigate = useNavigate();
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});
  const [responseData, setResponseData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiClass = new API_SERVICES();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isOtpMode) {
      return;
    }

    const nextErrors = {};
    if (!emailOrPhone?.trim()) {
      nextErrors.email = "Email is required";
    } else if (!validateEmail(emailOrPhone).valid) {
      nextErrors.email = validateEmail(emailOrPhone).message;
    }

    if (!password) {
      nextErrors.password = "Password is required";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    // console.log("res-------",res);
    try {
      const res = await dispatch(
        loginUser({
          email: emailOrPhone,
          password,
        })
      ).unwrap();
      console.log("res", res);
      
      setResponseData(res);

      if (res?._id) {
        navigate("/");
      }

    } catch (error) {
      setResponseData({
        success: false,
        message: error || "Unable to login right now. Please try again.",
      });
      console.log("error on loggin---" , error)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        {/* Login card */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          {/* Logo / Title */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-block">
              <span className="font-bold text-2xl text-flipkart-blue">
                Flip<span className="text-flipkart-yellow">Cart</span>
              </span>
            </Link>
            <p className="text-gray-600 text-sm mt-2">
              {isOtpMode ? "Enter OTP sent to your mobile" : "Login to your account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email or Phone */}
            <div>
              <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Email
              </label>
              <input
                id="emailOrPhone"
                type="text"
                value={emailOrPhone}
                onChange={(e) => {
                  setEmailOrPhone(e.target.value);
                  setErrors((prev) => ({ ...prev, email: "" }));
                }}
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-flipkart-blue focus:border-flipkart-blue outline-none"
                required
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Password or OTP */}
            {isOtpMode ? (
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  maxLength={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-flipkart-blue focus:border-flipkart-blue outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  OTP sent to your mobile number
                </p>
              </div>
            ) : (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    placeholder="Enter your password"
                    className="w-full rounded border border-gray-300 px-4 py-2.5 pr-11 outline-none focus:border-flipkart-blue focus:ring-2 focus:ring-flipkart-blue"
                    required={!isOtpMode}
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
                {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
              </div>
            )}

            {/* Terms */}
            <p className="text-xs text-gray-500">
              By continuing, you agree to FlipCart&apos;s{" "}
              <Link to="/terms" className="text-flipkart-blue hover:underline">Terms of Use</Link>
              {" "}and{" "}
              <Link to="/privacy" className="text-flipkart-blue hover:underline">Privacy Policy</Link>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-flipkart-yellow text-flipkart-blue font-medium rounded hover:bg-yellow-400 transition-colors"
            >
              {isOtpMode ? "Verify OTP" : isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>
          {responseData && !responseData.success && (
            <p className="mt-4 text-center text-red-600">
              {responseData.message || "Login failed"}
            </p>
          )}

          {/* OTP toggle */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsOtpMode(!isOtpMode)}
              className="text-flipkart-blue text-sm font-medium hover:underline"
            >
              {isOtpMode ? "Login with Password" : "Request OTP"}
            </button>
          </div>

          {/* Sign up link */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <Link
              to="/signup"
              className="text-flipkart-blue font-medium hover:underline"
            >
              New to FlipCart? Create an account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
