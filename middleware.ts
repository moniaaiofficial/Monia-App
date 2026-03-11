import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  // Public routes - accessible without authentication
  publicRoutes: [
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
  ],

  afterAuth(auth, req) {
    const { pathname } = req.nextUrl;

    // Allow public routes and static files
    const isPublicRoute = [
      "/",
      "/welcome",
      "/auth/",
      "/api/webhooks/",
      "/legal/",
    ].some(route => pathname === route || pathname.startsWith(route));

    // If not logged in and trying to access protected route
    if (!auth.userId && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // If logged in and on auth pages (except verify-email during signup flow)
    if (auth.userId) {
      const authPages = ["/auth/login", "/auth/signup", "/auth/forgot-password"];
      if (authPages.includes(pathname)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // If logged in and on landing page, redirect to dashboard
    if (auth.userId && pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    return NextResponse.next();
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

