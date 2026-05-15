import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { ADMIN_SESSION_COOKIE } from "@/lib/office-requests/session";
import { getUserProfile } from "@/lib/office-requests/store";

type SessionErrorBody = {
  error: string;
  code: string;
  debugMessage?: string;
};

function readErrorFields(error: unknown): { code: string; message: string } {
  if (error instanceof Error) {
    const raw = (error as { code?: unknown }).code;
    const code =
      raw === undefined || raw === null ? "" : String(raw);
    return { code, message: error.message };
  }
  return { code: "", message: String(error) };
}

function classifySessionError(error: unknown): {
  status: number;
  body: Omit<SessionErrorBody, "debugMessage">;
} {
  const { code, message } = readErrorFields(error);

  if (code.startsWith("auth/")) {
    return {
      status: 401,
      body: {
        error:
          "تعذر التحقق من الجلسة. أعد المحاولة أو تحقق من تطابق إعدادات Firebase بين العميل والخادم.",
        code: "auth_failed",
      },
    };
  }

  if (
    code === "7" ||
    code === "permission-denied" ||
    message.includes("PERMISSION_DENIED") ||
    message.includes("permission-denied")
  ) {
    return {
      status: 503,
      body: {
        error: "خدمة البيانات غير متاحة مؤقتاً. حاول لاحقاً.",
        code: "datastore_permission",
      },
    };
  }

  if (
    code === "14" ||
    message.includes("UNAVAILABLE") ||
    message.includes("DEADLINE_EXCEEDED") ||
    message.includes("ETIMEDOUT")
  ) {
    return {
      status: 503,
      body: {
        error: "خدمة البيانات غير متاحة مؤقتاً. حاول لاحقاً.",
        code: "datastore_unavailable",
      },
    };
  }

  if (message.includes("Firebase Admin environment variables")) {
    return {
      status: 500,
      body: {
        error: "خطأ في إعدادات الخادم (Firebase Admin).",
        code: "server_misconfigured",
      },
    };
  }

  return {
    status: 500,
    body: {
      error: "تعذر تسجيل الدخول، تحقق من الإعدادات والبيانات.",
      code: "internal_error",
    },
  };
}

export async function POST(request: Request) {
  const isDev = process.env.NODE_ENV === "development";

  let idToken: string | undefined;
  try {
    const body = (await request.json()) as { idToken?: string };
    idToken = body.idToken;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", code: "invalid_json" },
      { status: 400 },
    );
  }

  if (!idToken) {
    return NextResponse.json(
      { error: "Missing token", code: "missing_token" },
      { status: 400 },
    );
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const profile = await getUserProfile(decoded.uid);
    if (!profile) {
      return NextResponse.json(
        {
          error: "لا يوجد حساب مسؤول مرتبط بهذا المستخدم.",
          code: "forbidden_no_profile",
        },
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
  } catch (error: unknown) {
    if (isDev) {
      console.error("[api/admin/session]", error);
    }

    const { status, body } = classifySessionError(error);
    const payload: SessionErrorBody = isDev
      ? {
          ...body,
          debugMessage: readErrorFields(error).message,
        }
      : body;

    return NextResponse.json(payload, { status });
  }
}
