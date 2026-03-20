import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
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
  "/demo(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
