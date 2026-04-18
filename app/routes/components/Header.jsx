import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { API_SERVICES } from "../Services/Apis";

const categories = [
  "Electronics",
  "TV & Appliances",
  "Men",
  "Women",
  "Baby & Kids",
  "Home & Furniture",
  "Sports & More",
  "Grocery",
];

export function Header({ isAuthenticated = false, isMerchant = false }) {
  const navigate = useNavigate();
  const apiClass = new API_SERVICES();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const res = await apiClass.logout();
      if (!res?.success) {
        return;
      }
      setMobileMenuOpen(false);
      navigate("/");
      window.location.reload();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top bar - Flipkart blue */}
      <div className="bg-flipkart-blue text-white">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-2">
          <div className="flex items-center gap-2 sm:gap-4 justify-between">
            {/* Mobile menu toggle */}
            <button
              type="button"
              aria-label="Open menu"
              className="lg:hidden p-2 -ml-2 hover:bg-white/10 rounded"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-1 shrink-0 min-w-0">
              <span className="font-bold text-xl sm:text-2xl tracking-tight">
                Flip<span className="text-flipkart-yellow">Cart</span>
              </span>
              <span className="hidden sm:inline text-xs text-white/90 -mt-2">▼ Explore Plus</span>
            </Link>

            {/* Search bar - full row on mobile, inline on desktop */}
            <div className="flex-1 min-w-0 max-w-2xl mx-2 sm:mx-4 order-last sm:order-none w-full sm:w-auto mt-2 sm:mt-0">
              <form
                action="/search"
                method="get"
                className="flex items-center bg-white rounded-md h-9 sm:h-10 border border-transparent focus-within:border-white/40 focus-within:ring-2 focus-within:ring-white/30"
              >
                <span className="pl-3 text-gray-400" aria-hidden>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-4.65a6 6 0 11-12 0 6 6 0 0112 0z" />
                  </svg>
                </span>
                <input
                  type="search"
                  name="q"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, brands and more"
                  className="flex-1 min-w-0 px-2 sm:px-3 text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none"
                  aria-label="Search products"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-gray-400 hover:text-gray-600 px-2"
                    aria-label="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-flipkart-yellow text-flipkart-blue hover:bg-[#f5dd00] px-3 sm:px-4 h-full flex items-center justify-center shrink-0 font-semibold text-sm"
                  aria-label="Search"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Login - desktop */}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 hover:bg-white/10 rounded font-medium text-sm"
                >
                  Login
                </Link>
              )}

              {/* Become a Seller - desktop */}
              {isMerchant ? (
                <Link
                  to="/merchant"
                  className="hidden md:flex items-center px-3 py-1.5 hover:bg-white/10 rounded text-sm"
                >
                  Seller Hub
                </Link>
              ) : (
                <Link
                  to="/sell"
                  className="hidden md:flex items-center px-3 py-1.5 hover:bg-white/10 rounded text-sm"
                >
                  Become a Seller
                </Link>
              )}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden md:flex items-center px-3 py-1.5 hover:bg-white/10 rounded text-sm"
                >
                  Logout
                </button>
              )}

              {/* More dropdown - desktop */}
              <div className="relative hidden lg:block">
                <button
                  type="button"
                  className="flex items-center gap-1 px-3 py-1.5 hover:bg-white/10 rounded text-sm"
                  onClick={() => setMoreOpen(!moreOpen)}
                  aria-expanded={moreOpen}
                >
                  More
                  <svg className={`w-4 h-4 transition-transform ${moreOpen ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {moreOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} aria-hidden />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white text-gray-800 rounded shadow-lg py-1 z-20">
                      <Link to="/notification" className="block px-4 py-2 hover:bg-gray-100 text-sm">Notification Preferences</Link>
                      <Link to="/orders" className="block px-4 py-2 hover:bg-gray-100 text-sm">24x7 Customer Care</Link>
                      <Link to="/advertise" className="block px-4 py-2 hover:bg-gray-100 text-sm">Advertise</Link>
                      <Link to="/download" className="block px-4 py-2 hover:bg-gray-100 text-sm">Download App</Link>
                    </div>
                  </>
                )}
              </div>

              {/* Cart */}
              <Link
                to="/cart"
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 hover:bg-white/10 rounded"
              >
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="hidden sm:inline text-sm font-medium">Cart</span>
                <span className="bg-flipkart-yellow text-flipkart-blue text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">0</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Categories bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 flex justify-center ">
          <nav className="hidden lg:flex items-center gap-6 py-2 overflow-x-auto ">
            {categories.map((cat) => (
              <Link
                key={cat}
                to={`/category/${cat.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm font-medium text-gray-700 hover:text-flipkart-blue whitespace-nowrap py-1"
              >
                {cat}
              </Link>
            ))}
          </nav>

          {/* Mobile menu / categories */}
          <div
            className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
              }`}
          >
            <nav className="py-4 space-y-1 border-t border-gray-100">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  to={`/category/${cat.toLowerCase().replace(/\s+/g, "-")}`}
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {cat}
                </Link>
              ))}
              <div className="border-t border-gray-100 mt-3 pt-3">
                {!isAuthenticated && (
                  <Link to="/login" className="block px-3 py-2 text-flipkart-blue font-medium" onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                )}
                {isMerchant ? (
                  <Link to="/merchant" className="block px-3 py-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                    Seller Hub
                  </Link>
                ) : (
                  <Link to="/sell/register" className="block px-3 py-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                    Become a Seller
                  </Link>
                )}
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded"
                  >
                    Logout
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
