
import { authMiddleware, redirectToSignIn } from "@clerk/nextjs";
import { NextResponse } from "next/server";

interface CustomPublicMetadata {
  profile_complete?: boolean;
}

export default authMiddleware({
  // Define public routes that don't require authentication
  publicRoutes: [
    "/",
    "/welcome",
    "/auth/login",
    "/auth/signup",
    "/auth/forgot-password",
    "/auth/sso-callback",
    "/auth/verify-email",
    "/api/webhooks/clerk",
    "/legal/privacy-policy",
    "/legal/terms",
  ],

  async afterAuth(auth, req) {
    const { userId, sessionClaims, orgId, isPublicRoute } = auth;
    const { pathname } = req.nextUrl;
    const publicMetadata = sessionClaims?.publicMetadata as CustomPublicMetadata | undefined;

    // If the user is logged in and on a public-only page (e.g., login, signup),
    // redirect them to the dashboard or profile setup.
    if (userId) {
      const publicOnlyPages = ["/auth/login", "/auth/signup", "/welcome"];
      if (publicOnlyPages.includes(pathname)) {
        const redirectUrl = publicMetadata?.profile_complete
          ? "/dashboard"
          : "/profile-setup";
        return NextResponse.redirect(new URL(redirectUrl, req.url));
      }
    }

    // For any route not explicitly public, check for authentication.
    // If the user is not logged in, redirect them to the sign-in page.
    const isProtectedRoute = !isPublicRoute;
    if (isProtectedRoute && !userId) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    // If the user is logged in but hasn't completed their profile,
    // force them to the profile-setup page.
    if (userId && !publicMetadata?.profile_complete) {
      if (pathname !== "/profile-setup" && pathname !== "/api/profile/update") {
        return NextResponse.redirect(new URL("/profile-setup", req.url));
      }
    }

    // If the user is logged in and has completed their profile, but they are on
    // the profile-setup page, redirect them to the dashboard.
    if (userId && publicMetadata?.profile_complete && pathname === "/profile-setup") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Special handling for the root URL: if logged in, go to dashboard,
    // otherwise go to the welcome page.
    if (pathname === "/") {
      const redirectUrl = userId ? "/dashboard" : "/welcome";
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    // Allow the request to proceed if none of the above conditions are met.
    return NextResponse.next();
  },
});

export const config = {
  // This matcher ensures the middleware runs on all routes except for static assets and special Next.js paths.
  matcher: ['/((?!.+\\.w+?$).*)', '/', '/(api|trpc)(.*)'],
};
