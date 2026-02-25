import { useState } from "react";
import { Link } from "react-router";
import { API_SERVICES } from "../Services/Apis";
export function meta() {
  return [
    { title: "Sign Up - FlipCart" },
    { name: "description", content: "Create your FlipCart account" },
  ];
}

export default function Signup() {
  const apiClass = new API_SERVICES();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
  };
  const submitHadle = async () => {
    const res = await apiClass.sign_up(formData);
    console.log("Response from API:", res);
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
              placeholder="Enter your name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-flipkart-blue focus:border-flipkart-blue outline-none"
              required
            />
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
              placeholder="Enter your email"
              className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-flipkart-blue focus:border-flipkart-blue outline-none"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange(e)}
              placeholder="Enter your password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-flipkart-blue focus:border-flipkart-blue outline-none"
              required
            />
          </div>

          {/* Number */}
          <div>
            <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            <input
              id="number"
              name="phone"
              type="number"
              value={formData.phone}
              onChange={(e) => handleChange(e)}
              placeholder="Enter your mobile number"
              className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-flipkart-blue focus:border-flipkart-blue outline-none"
              required
            />
          </div>

          <p className="text-xs text-gray-500">
            By continuing, you agree to FlipCart&apos;s{" "}
            <Link to="/terms" className="text-flipkart-blue hover:underline">Terms of Use</Link>
            {" "}and{" "}
            <Link to="/privacy" className="text-flipkart-blue hover:underline">Privacy Policy</Link>.
          </p>

          <button
            onClick={submitHadle}
            type="submit"
            className="w-full py-2.5 bg-flipkart-yellow text-flipkart-blue font-medium rounded hover:bg-yellow-400 transition-colors disabled:opacity-60"
          >
            Create Account
          </button>

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
