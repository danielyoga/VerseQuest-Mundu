import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const method = request.method;

  const isRsc = searchParams.has("_rsc");
  const inm = request.headers.get("if-none-match");
  const referer = request.headers.get("referer") ?? "";
  const refPath = referer ? referer.replace(/https?:\/\/[^/]+/, "") || "/" : "-";
  const ua = request.headers.get("user-agent") ?? "";
  const uaShort = ua.includes("Edg")
    ? "Edge"
    : ua.includes("Chrome")
      ? "Chrome"
      : ua.includes("Firefox")
        ? "Firefox"
        : ua.includes("Safari")
          ? "Safari"
          : "Other";

  const parts: string[] = [method, pathname];
  if (isRsc) parts.push(`rsc=${searchParams.get("_rsc")}`);
  if (inm) parts.push(`inm=${inm.slice(0, 16)}…`); // presence of inm → likely 304
  if (refPath !== "-") parts.push(`ref=${refPath}`);
  parts.push(uaShort);

  console.log(`[proxy] ${parts.join(" ")}`);

  return NextResponse.next();
}

export const config = {
  // Skip static assets; run on all page routes and API routes
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
