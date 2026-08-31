import { NextResponse, type NextRequest } from "next/server";

const authCookieName = "matchpredict_token";
const privateRoutes = [
  "/dashboard",
  "/matches",
  "/profile",
  "/predictions",
  "/statistics",
  "/transparency",
];
const publicAuthRoutes = ["/login", "/register"];
const socialPreviewCrawlerPattern =
  /facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|whatsapp|telegrambot|discordbot|googlebot|bingbot/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") ?? "";
  const token = request.cookies.get(authCookieName)?.value;
  const isPrivateRoute = privateRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isPublicAuthRoute = publicAuthRoutes.includes(pathname);

  if (isPrivateRoute && !token) {
    if (socialPreviewCrawlerPattern.test(userAgent)) {
      return NextResponse.rewrite(new URL("/", request.url));
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/matches/:path*",
    "/profile/:path*",
    "/predictions/:path*",
    "/statistics/:path*",
    "/transparency/:path*",
    "/login",
    "/register",
  ],
};
