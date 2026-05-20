export const REQUESTS_EXCEL_EXPORT_TIMEOUT_MS = 120_000;

export type RequestsExcelDownloadResult =
  | { ok: true; rowCount: number; capped: boolean; filename: string }
  | { ok: false; error: string };

function filenameFromContentDisposition(value: string | null): string | null {
  if (!value) return null;
  const utf8 = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8) {
    try {
      return decodeURIComponent(utf8);
    } catch {
      return utf8;
    }
  }
  return value.match(/filename="([^"]+)"/i)?.[1] ?? null;
}

export async function downloadRequestsExcel(
  url: string,
): Promise<RequestsExcelDownloadResult> {
  const abortController = new AbortController();
  const timeoutId = window.setTimeout(
    () => abortController.abort(),
    REQUESTS_EXCEL_EXPORT_TIMEOUT_MS,
  );

  try {
    const res = await fetch(url, {
      credentials: "include",
      headers: { "X-CQM-Admin-Request": "1" },
      signal: abortController.signal,
    });

    if (res.status === 401) {
      return {
        ok: false,
        error: "انتهت الجلسة أو غير مصرح. سجّل الدخول من جديد.",
      };
    }
    if (res.status === 403) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      return { ok: false, error: body?.error ?? "غير مصرح بتنفيذ هذا التصدير." };
    }
    if (res.status === 400) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      return { ok: false, error: body?.error ?? "طلب غير صالح." };
    }
    if (res.status === 503) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      return {
        ok: false,
        error:
          body?.error ??
          "الخادم غير مهيأ للاتصال بقاعدة البيانات. راجع إعدادات Firebase.",
      };
    }
    if (!res.ok) {
      const contentType = res.headers.get("Content-Type") ?? "";
      const body =
        contentType.includes("application/json")
          ? ((await res.json().catch(() => null)) as { error?: string } | null)
          : null;
      return {
        ok: false,
        error: body?.error ?? "تعذر إنشاء الملف. حاول مرة أخرى.",
      };
    }

    const blob = await res.blob();
    if (blob.size === 0) {
      return {
        ok: false,
        error: "تم إنشاء ملف فارغ. غيّر التصفية وحاول مرة أخرى.",
      };
    }

    const capped = res.headers.get("X-Export-Capped") === "true";
    const rowCount = Number(res.headers.get("X-Export-Row-Count") ?? "0");
    const filename =
      filenameFromContentDisposition(
        res.headers.get("Content-Disposition"),
      ) ?? `requests-${new Date().toISOString().slice(0, 10)}.xlsx`;

    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);

    return { ok: true, rowCount, capped, filename };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        ok: false,
        error: "انتهت مهلة التحميل. ضيّق التصفية أو حاول لاحقاً.",
      };
    }
    return { ok: false, error: "تعذر تنزيل الملف. تحقق من الاتصال وحاول مرة أخرى." };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function buildRequestsExcelExportUrl(
  params: URLSearchParams,
): string {
  const qs = params.toString();
  return `/api/admin/requests/export${qs ? `?${qs}` : ""}`;
}
