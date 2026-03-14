import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/welcome",
  "/auth/login",
  "/auth/signup",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/sso-callback",
  "/api/webhooks/clerk",
  "/legal/privacy-policy",
  "/legal/terms",
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const { userId } = await auth();

  if (!isPublicRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  if (userId) {
    const authPages = ["/auth/login", "/auth/signup", "/auth/forgot-password"];
    if (authPages.includes(pathname)) {
      return NextResponse.redirect(new URL("/app/dashboard", req.url));
    }
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/app/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
