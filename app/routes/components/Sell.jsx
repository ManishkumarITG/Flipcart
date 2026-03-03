import { Link, useLoaderData } from "react-router";

const onboardingSteps = [
  {
    title: "Create Account",
    description: "Register with your GST and pickup details in just a few clicks.",
  },
  {
    title: "List Your Products",
    description: "Upload catalog, pricing, and inventory to start selling quickly.",
  },
  {
    title: "Start Selling",
    description: "Receive orders, ship with partner logistics, and grow your business.",
  },
];

const benefits = [
  "45+ crore Flipkart customers",
  "Pan-India delivery support",
  "Timely payments and seller support",
  "Simple onboarding and catalog tools",
];

export function meta() {
  return [
    { title: "Become a Seller | FlipCart" },
    {
      name: "description",
      content: "Join FlipCart Seller Hub and start selling to millions of customers.",
    },
  ];
}

export async function loader({ request }) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const isMerchant = cookieHeader
    .split(";")
    .some((cookie) => cookie.trim().startsWith("merchant="));

  return { isMerchant };
}

export default function SellPage() {
  const { isMerchant } = useLoaderData();
  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <section className="bg-flipkart-blue text-white">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold tracking-wide text-white/80">FlipCart Seller Hub</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Grow your business with FlipCart Marketplace
              </h1>
              <p className="mt-4 max-w-xl text-base text-white/90 sm:text-lg">
                Reach millions of customers across India with easy onboarding, smart tools, and trusted logistics.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/sell/register"
                  className="rounded-md bg-flipkart-yellow px-6 py-3 text-sm font-bold text-flipkart-blue hover:bg-[#f6de00]"
                >
                  Start Selling
                </Link>
                <a
                  href="#how-it-works"
                  className="rounded-md border border-white/50 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Learn More
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Why sellers choose us</p>
              <ul className="mt-4 space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm sm:text-base">
                    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-flipkart-yellow text-center text-xs font-bold leading-5 text-flipkart-blue">
                      &#10003;
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-[1400px] px-4 py-12 sm:py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">Start in 3 Simple Steps</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {onboardingSteps.map((step, index) => (
            <article key={step.title} className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-100">
              {index === 0 && isMerchant ? (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                  &#10003;
                </span>
              ) : (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f0fe] text-sm font-bold text-flipkart-blue">
                  {index + 1}
                </span>
              )}
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-16">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100 sm:p-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Ready to become a FlipCart seller?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
            Start your online selling journey today and scale with FlipCart's marketplace ecosystem.
          </p>
          <Link
            to="/sell/register"
            className="mt-6 inline-flex rounded-md bg-flipkart-blue px-7 py-3 text-sm font-semibold text-white hover:bg-[#1f63d3]"
          >
            Register as Seller
          </Link>
        </div>
      </section>
    </div>
  );
}
