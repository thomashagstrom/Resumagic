import { auth } from "@/lib/auth";
import { shouldRedirectToSignIn } from "@/lib/route-guard";

export default auth((req) => {
  if (shouldRedirectToSignIn(req.nextUrl.pathname, !!req.auth)) {
    const signInUrl = new URL("/signin", req.nextUrl);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
