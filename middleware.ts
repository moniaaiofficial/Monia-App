
import { authMiddleware, redirectToSignIn } from "@clerk/nextjs";
import { NextResponse } from "next/server";

interface CustomPublicMetadata {
  profile_complete?: boolean;
}

interface Verification {
  strategy: string;
}

interface EmailAddress {
  verification: Verification;
}

interface CustomSessionClaims {
  publicMetadata?: CustomPublicMetadata;
  email_addresses?: EmailAddress[];
}

export default authMiddleware({
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
    const { userId, sessionClaims: rawSessionClaims } = auth;
    const sessionClaims = rawSessionClaims as CustomSessionClaims | null;
    const { pathname } = req.nextUrl;
    const publicMetadata = sessionClaims?.publicMetadata;

    const isGoogleUser = sessionClaims &&
      Array.isArray(sessionClaims?.email_addresses) &&
      sessionClaims.email_addresses.length > 0 &&
      sessionClaims.email_addresses[0]?.verification?.strategy === "oauth_google";

    // If the user is logged in, and they are on a public-only page,
    // redirect them to the dashboard.
    if (userId) {
      if (pathname === "/welcome" || pathname === "/auth/login" || pathname === "/auth/signup") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // If the user is not logged in and they are trying to access a protected route,
    // redirect them to the login page.
    if (!userId && !auth.isPublicRoute) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    // If the user signed up with Google and has not completed their profile,
    // redirect them to the profile-setup page.
    if (isGoogleUser && userId && !publicMetadata?.profile_complete && pathname !== "/profile-setup") {
      return NextResponse.redirect(new URL("/profile-setup", req.url));
    }

    // If the user is logged in and has completed their profile,
    // but they are on the profile-setup page,
    // redirect them to the dashboard.
    if (userId && publicMetadata?.profile_complete && pathname === "/profile-setup") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: ["/((?!.+\.[\w]+$|_next).*)" , "/", "/(api|trpc)(.*)"],
};
