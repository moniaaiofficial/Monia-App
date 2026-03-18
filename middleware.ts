
import { authMiddleware } from "@clerk/nextjs";

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
});

export const config = {
  matcher: ['/((?!.+\.[\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
