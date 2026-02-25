import { useState } from "react";
import { Link } from "react-router";

export function meta() {
  return [
    { title: "Login - FlipCart" },
    { name: "description", content: "Login to your FlipCart account" },
  ];
}

export default function Login() {
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add login/OTP action
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
                Enter Email or Mobile Number
              </label>
              <input
                id="emailOrPhone"
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="Enter your email or phone"
                className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-flipkart-blue focus:border-flipkart-blue outline-none"
                required
              />
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
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-flipkart-blue focus:border-flipkart-blue outline-none"
                  required={!isOtpMode}
                />
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
              className="w-full py-2.5 bg-flipkart-yellow text-flipkart-blue font-medium rounded hover:bg-yellow-400 transition-colors"
            >
              {isOtpMode ? "Verify OTP" : "Login"}
            </button>
          </form>

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
