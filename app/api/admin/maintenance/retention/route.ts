import { NextResponse } from "next/server";
import { runRetentionMaintenance } from "@/lib/office-requests/retention";

function bearerToken(request: Request): string {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(/\s+/, 2);
  return scheme?.toLowerCase() === "bearer" ? token ?? "" : "";
}

export async function POST(request: Request) {
  const expected = process.env.MAINTENANCE_CRON_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "MAINTENANCE_CRON_SECRET غير مضبوط." },
      { status: 500 },
    );
  }
  if (bearerToken(request) !== expected) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }

  try {
    const result = await runRetentionMaintenance();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشلت صيانة البيانات." },
      { status: 500 },
    );
  }
}
