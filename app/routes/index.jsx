import { Link, useLoaderData } from "react-router";
import { connectDB } from "../server/configs/db.server";
import { getRandomProducts } from "../server/service/product.service";
import { ProductCard } from "./components/ProductCard";

export function meta() {
  return [
    { title: "FlipCart - Online Shopping" },
    { name: "description", content: "Welcome to FlipCart!" },
  ];
}

export async function loader() {
  await connectDB();
  const products = await getRandomProducts(4);
  return { products: Array.isArray(products) ? products : [] };
}

export default function Index() {
  const { products = [] } = useLoaderData() || {};

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <section className="mx-auto max-w-[1400px] px-3 py-4 sm:px-4 sm:py-6">
        <div className="rounded-md bg-white shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
              Featured Products
            </h2>
            <Link
              to="/products"
              className="rounded bg-flipkart-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1f63d3] sm:text-sm"
            >
              View All
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500 sm:px-6">
              No products available yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
