import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  // Ye wo routes hain jinhe bina login ke access kiya ja sakta hai
  publicRoutes: ["/", "/api/webhooks/clerk"],
  
  afterAuth(auth, req) {
    // Agar user logged in nahi hai aur '/app' wale pages par jane ki koshish kare
    if (!auth.userId && req.nextUrl.pathname.startsWith("/app")) {
      const signInUrl = new URL("/", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Agar user logged in hai aur landing page par hai, toh seedha dashboard (/app) bhejo
    if (auth.userId && req.nextUrl.pathname === "/") {
      const dashboard = new URL("/app", req.url);
      return NextResponse.redirect(dashboard);
    }
  }
});

export const config = {
  // Ye matcher Clerk ko batata hai ki use kahan-kahan active rehna hai
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

