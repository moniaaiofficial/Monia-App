import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  // Ye pages bina login ke khulenge
  publicRoutes: ["/", "/api/webhooks/clerk"],

  afterAuth(auth, req) {
    // 1. Agar login nahi hai aur /app page par jana chahta hai
    if (!auth.userId && req.nextUrl.pathname.startsWith("/app")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // 2. Agar login hai aur landing page par hai, toh dashboard (/app) bhejo
    if (auth.userId && req.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/app", req.url));
    }
    
    return NextResponse.next();
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

