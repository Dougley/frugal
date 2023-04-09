import { createCookie } from "@remix-run/cloudflare";

export const loginState = createCookie("loginState", {
  // a state is very short-lived, so we set a short maxAge
  maxAge: 60 * 60, // 1 hour
});

export const session = createCookie("session", {
  maxAge: 60 * 60 * 24 * 7, // 1 week
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  secrets: ["my-secret"], // TODO
});
