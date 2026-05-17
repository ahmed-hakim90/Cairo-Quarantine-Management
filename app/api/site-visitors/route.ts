import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitKeyFromHeaders } from "@/lib/rate-limit";
import {
  getSiteVisitorCount,
  incrementSiteVisitorCount,
} from "@/lib/site-stats/store";

const VISITOR_COOKIE = "cqm_visitor_counted";
const COOKIE_MAX_AGE_SECONDS = 86_400;

function rateLimit(req: Request) {
  return checkRateLimit({
    key: rateLimitKeyFromHeaders(req.headers, "site-visitors"),
    limit: 10,
    windowMs: 60_000,
  });
}

function rateLimitedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "rate_limited" },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

function visitorCountedCookie() {
  return {
    name: VISITOR_COOKIE,
    value: "1",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  };
}

export async function GET(req: Request) {
  const limit = rateLimit(req);
  if (!limit.allowed) return rateLimitedResponse(limit.retryAfterSeconds);

  const total = await getSiteVisitorCount();
  return NextResponse.json({ total });
}

export async function POST(req: Request) {
  const limit = rateLimit(req);
  if (!limit.allowed) return rateLimitedResponse(limit.retryAfterSeconds);

  const jar = await cookies();
  const alreadyCounted = jar.get(VISITOR_COOKIE)?.value === "1";

  if (alreadyCounted) {
    const total = await getSiteVisitorCount();
    return NextResponse.json({ total, counted: false });
  }

  const total = await incrementSiteVisitorCount();
  const res = NextResponse.json({ total, counted: true });
  res.cookies.set(visitorCountedCookie());
  return res;
}
