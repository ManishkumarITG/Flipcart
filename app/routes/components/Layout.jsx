import { Header } from "./Header";
import { Outlet, useLoaderData } from "react-router";

export async function loader({ request }) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const isAuthenticated = cookieHeader
    .split(";")
    .some((cookie) => cookie.trim().startsWith("token="));
  const isMerchant = cookieHeader
    .split(";")
    .some((cookie) => cookie.trim().startsWith("merchant="));

  return { isAuthenticated, isMerchant };
}

export default function Layout() {
  const { isAuthenticated = false, isMerchant = false } = useLoaderData() || {};

  return (
    <>
      <Header isAuthenticated={isAuthenticated} isMerchant={isMerchant} />

      <main style={{ minHeight: "80vh" }}>
        <Outlet />
      </main>

    </>
  );
}
