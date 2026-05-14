import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { ADMIN_SESSION_COOKIE } from "@/lib/office-requests/session";
import { getUserProfile } from "@/lib/office-requests/store";

export async function POST(request: Request) {
  try {
    const { idToken } = (await request.json()) as { idToken?: string };
    if (!idToken) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const profile = await getUserProfile(decoded.uid);
    if (!profile?.active) {
      return NextResponse.json(
        { error: "هذا المستخدم غير مفعل في لوحة الإدارة." },
        { status: 403 },
      );
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn,
    });

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expiresIn / 1000,
      path: "/",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "تعذر تسجيل الدخول، تحقق من الإعدادات والبيانات." },
      { status: 401 },
    );
  }
}
