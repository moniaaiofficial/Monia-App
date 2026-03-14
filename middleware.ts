import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
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

    if (!auth.userId && pathname.startsWith("/app")) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    if (auth.userId) {
      const authPages = ["/auth/login", "/auth/signup", "/auth/forgot-password"];
      if (authPages.includes(pathname)) {
        return NextResponse.redirect(new URL("/app/dashboard", req.url));
      }
    }

    if (auth.userId && pathname === "/") {
      return NextResponse.redirect(new URL("/app/dashboard", req.url));
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
