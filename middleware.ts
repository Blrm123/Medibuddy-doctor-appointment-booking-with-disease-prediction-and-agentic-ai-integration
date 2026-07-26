import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Match all routes including static assets & 404 pages so Clerk context is always active
    '/(.*)',
  ],
};
