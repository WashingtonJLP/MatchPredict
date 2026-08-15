import { NextResponse, type NextRequest } from "next/server";

const authCookieName = "matchpredict_token";
const privateRoutes = ["/dashboard", "/profile", "/predictions", "/statistics"];
const publicAuthRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(authCookieName)?.value;
  const isPrivateRoute = privateRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isPublicAuthRoute = publicAuthRoutes.includes(pathname);

  if (isPrivateRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/predictions/:path*", "/statistics/:path*", "/login", "/register"],
};
