import { createCookie } from "@remix-run/node";

export const authCookie = createCookie("token", {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  path: "/",
});