/**
 * Capture handover / ministry presentation screenshots from a running dev server.
 *
 * Prerequisites:
 *   npm run dev
 *
 * Public pages only:
 *   npx tsx scripts/capture-handover-screenshots.ts
 *
 * With admin + booking pass (requires .env.local + Firebase):
 *   npx tsx --env-file=.env.local scripts/capture-handover-screenshots.ts
 *
 * Optional env:
 *   HANDOVER_BASE_URL=http://localhost:3000
 *   HANDOVER_ADMIN_EMAIL / HANDOVER_ADMIN_PASSWORD
 *   HANDOVER_OFFICE_ID=cairo-trav-1
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { DEFAULT_GOVERNORATE_ID } from "@/data/governorates";
import { getCairoMinBookingYmd } from "@/lib/cairo-today-ymd";
import {
  buildBookingPassPath,
  buildOfficeCheckinPath,
} from "@/lib/booking-pass-url";
import { officeAcceptsTravelerState } from "@/lib/office-requests/office-traveler-state";
import { isFirebaseAdminConfigured, getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { createOfficeRequest, getOffice } from "@/lib/office-requests/store";
import { DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR } from "@/lib/office-requests/types";

const ROOT = join(import.meta.dirname, "..");
const OUT_DIR = join(ROOT, "docs", "handover", "screenshots");
const BASE = (process.env.HANDOVER_BASE_URL ?? "http://localhost:3000").replace(
  /\/+$/,
  "",
);
const LOCALE = "ar";
const OFFICE_ID = process.env.HANDOVER_OFFICE_ID?.trim() || "cairo-trav-1";
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

type CaptureSpec = {
  file: string;
  path: string;
  fullPage?: boolean;
  viewport?: { width: number; height: number };
  before?: (page: Page) => Promise<void>;
};

function localePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${LOCALE}${normalized}`;
}

async function waitForReady(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(600);
}

async function capture(page: Page, spec: CaptureSpec): Promise<boolean> {
  const viewport = spec.viewport ?? DESKTOP;
  await page.setViewportSize(viewport);
  const url = `${BASE}${spec.path.startsWith("/") ? spec.path : localePath(spec.path)}`;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await waitForReady(page);
    if (spec.before) await spec.before(page);
    await page.screenshot({
      path: join(OUT_DIR, spec.file),
      fullPage: spec.fullPage ?? false,
    });
    console.log(`✓ ${spec.file}`);
    return true;
  } catch (error) {
    console.warn(`✗ ${spec.file}: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

async function findSuperAdminUid(): Promise<string | undefined> {
  const snap = await getAdminDb()
    .collection("users")
    .where("role", "==", "super_admin")
    .limit(5)
    .get();
  for (const doc of snap.docs) {
    const data = doc.data() as { active?: boolean };
    if (data.active !== false) return doc.id;
  }
  return snap.docs[0]?.id;
}

async function loginAdmin(page: Page): Promise<boolean> {
  const email = process.env.HANDOVER_ADMIN_EMAIL?.trim();
  const password = process.env.HANDOVER_ADMIN_PASSWORD?.trim();
  if (email && password) {
    await page.goto(`${BASE}/${LOCALE}/admin/login`, {
      waitUntil: "domcontentloaded",
    });
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    try {
      await page.waitForURL(
        (url) =>
          url.pathname.includes("/admin") && !url.pathname.includes("/login"),
        { timeout: 25_000 },
      );
      await waitForReady(page);
      console.log("✓ Admin login (email/password)");
      return true;
    } catch {
      console.warn("✗ Admin email/password login failed — trying custom token");
    }
  }

  if (!isFirebaseAdminConfigured()) {
    console.warn(
      "Skipping admin screenshots — set HANDOVER_ADMIN_EMAIL/PASSWORD or configure Firebase Admin",
    );
    return false;
  }

  const uid =
    process.env.HANDOVER_ADMIN_UID?.trim() || (await findSuperAdminUid());
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  if (!uid || !apiKey) {
    console.warn("Skipping admin screenshots — no super_admin uid or API key");
    return false;
  }

  try {
    const customToken = await getAdminAuth().createCustomToken(uid);
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      },
    );
    if (!signInRes.ok) {
      throw new Error(`signInWithCustomToken HTTP ${signInRes.status}`);
    }
    const signInJson = (await signInRes.json()) as { idToken?: string };
    if (!signInJson.idToken) throw new Error("Missing idToken");

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await getAdminAuth().createSessionCookie(
      signInJson.idToken,
      { expiresIn },
    );
    await page.context().addCookies([
      {
        name: "cqm_admin_session",
        value: sessionCookie,
        domain: new URL(BASE).hostname,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    await page.goto(`${BASE}/${LOCALE}/admin`, { waitUntil: "domcontentloaded" });
    await waitForReady(page);
    if (page.url().includes("/login")) {
      throw new Error("Session cookie did not grant admin access");
    }
    console.log(`✓ Admin login (custom token, uid=${uid})`);
    return true;
  } catch (error) {
    console.warn(
      `✗ Admin custom-token login failed: ${error instanceof Error ? error.message : error}`,
    );
    return false;
  }
}

async function resolveTravelerStateId(
  officeId: string,
): Promise<string | undefined> {
  const office = await getOffice(officeId);
  if (!office) return undefined;
  for (const id of ["international", "hajj_umrah", "citizen"]) {
    if (officeAcceptsTravelerState(office, id)) return id;
  }
  return office.travelerStateIds?.[0];
}

async function createSampleBooking(): Promise<{
  requestId: string;
  passToken: string;
} | null> {
  if (!isFirebaseAdminConfigured()) {
    console.warn("Skipping booking pass — Firebase Admin not configured");
    return null;
  }

  const office = await getOffice(OFFICE_ID);
  if (!office?.active) {
    console.warn(`Skipping booking pass — office ${OFFICE_ID} unavailable`);
    return null;
  }

  const travelerStateId = await resolveTravelerStateId(OFFICE_ID);
  const preferredDate = getCairoMinBookingYmd(DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR);

  try {
    const created = await createOfficeRequest({
      governorateId: DEFAULT_GOVERNORATE_ID,
      officeId: OFFICE_ID,
      type: "booking",
      travelerStateId,
      preferredDate,
      name: "مواطن تجريبي",
      phone: `2010${String(Date.now()).slice(-8)}`,
      details: "لقطة شاشة للعرض التقديمي",
    });
    console.log(`✓ Sample booking #${created.id}`);
    return { requestId: created.id, passToken: created.passToken };
  } catch (error) {
    console.warn(
      `✗ Sample booking failed: ${error instanceof Error ? error.message : error}`,
    );
    return null;
  }
}

async function captureSaudiRequirements(page: Page): Promise<boolean> {
  const ok = await capture(page, {
    file: "saudi-requirements-ar.png",
    path: "/international-traveler",
    fullPage: true,
    before: async (p) => {
      await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
      await p.waitForTimeout(400);
      const input = p.locator('[role="combobox"], input[type="search"]').first();
      const visible = await input.isVisible().catch(() => false);
      if (!visible) return;
      await input.scrollIntoViewIfNeeded();
      await input.click();
      await input.fill("السعود");
      await p.waitForTimeout(600);
      const option = p
        .locator('[role="listbox"] [role="option"]')
        .filter({ hasText: /Saudi|السعود/i })
        .first();
      if (await option.count()) {
        await option.click();
        await p.waitForTimeout(500);
      }
    },
  });
  if (ok) return true;
  const fallback = join(OUT_DIR, "02-public-international-traveler-ar.png");
  const target = join(OUT_DIR, "saudi-requirements-ar.png");
  if (existsSync(fallback)) {
    copyFileSync(fallback, target);
    console.log("✓ saudi-requirements-ar.png (fallback from 02)");
    return true;
  }
  return false;
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });

  const sampleBooking = await createSampleBooking();

  const publicCaptures: CaptureSpec[] = [
    { file: "01-public-home-ar.png", path: "/", fullPage: true },
    {
      file: "02-public-international-traveler-ar.png",
      path: "/international-traveler",
      fullPage: true,
    },
    { file: "03-public-booking-ar.png", path: "/booking", fullPage: true },
    { file: "04-public-complaint-ar.png", path: "/complaint", fullPage: true },
    { file: "05-public-my-requests-ar.png", path: "/my-requests", fullPage: true },
    {
      file: "06-public-checkin-ar.png",
      path: buildOfficeCheckinPath(LOCALE, OFFICE_ID),
      fullPage: true,
    },
    { file: "07-public-hajj-umrah-ar.png", path: "/hajj-umrah", fullPage: true },
    {
      file: "08-public-citizen-services-ar.png",
      path: "/citizen-services",
      fullPage: true,
    },
    { file: "09-public-charter-ar.png", path: "/charter", fullPage: true },
    {
      file: "24-public-home-mobile-ar.png",
      path: "/",
      fullPage: true,
      viewport: MOBILE,
    },
    {
      file: "25-public-home-en.png",
      path: "/en/",
      fullPage: true,
    },
  ];

  if (sampleBooking) {
    publicCaptures.push({
      file: "14-public-booking-pass-ar.png",
      path: buildBookingPassPath(
        LOCALE,
        sampleBooking.requestId,
        sampleBooking.passToken,
      ),
      fullPage: true,
    });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: "ar-EG" });
  const page = await context.newPage();

  let ok = 0;
  let total = 0;

  for (const spec of publicCaptures) {
    total += 1;
    if (await capture(page, spec)) ok += 1;
  }

  total += 1;
  if (await captureSaudiRequirements(page)) ok += 1;

  total += 1;
  if (
    await capture(page, {
      file: "10-admin-login-ar.png",
      path: "/admin/login",
      fullPage: true,
    })
  ) {
    ok += 1;
  }

  const adminLoggedIn = await loginAdmin(page);
  if (adminLoggedIn) {
    const adminCaptures: CaptureSpec[] = [
      { file: "11-admin-dashboard-ar.png", path: "/admin", fullPage: true },
      { file: "12-admin-requests-ar.png", path: "/admin/requests", fullPage: true },
      { file: "15-admin-offices-ar.png", path: "/admin/offices", fullPage: true },
      {
        file: "16-admin-destination-countries-ar.png",
        path: "/admin/destination-countries",
        fullPage: true,
      },
      { file: "17-admin-settings-ar.png", path: "/admin/settings", fullPage: true },
      { file: "18-admin-queue-hub-ar.png", path: "/admin/queue", fullPage: true },
      {
        file: "19-admin-office-queue-ar.png",
        path: `/office-dashboard/${OFFICE_ID}/queue`,
        fullPage: true,
      },
      { file: "20-admin-vaccines-ar.png", path: "/admin/vaccines", fullPage: true },
      { file: "21-admin-users-ar.png", path: "/admin/users", fullPage: true },
      { file: "22-admin-activity-ar.png", path: "/admin/activity", fullPage: true },
      {
        file: "23-admin-traveler-states-ar.png",
        path: "/admin/traveler-states",
        fullPage: true,
      },
    ];

    for (const spec of adminCaptures) {
      total += 1;
      if (await capture(page, spec)) ok += 1;
    }

    total += 1;
    const detailPath =
      sampleBooking != null
        ? `/${LOCALE}/admin/requests/${sampleBooking.requestId}`
        : undefined;
    if (
      detailPath &&
      (await capture(page, {
        file: "13-admin-request-detail-ar.png",
        path: detailPath,
        fullPage: true,
      }))
    ) {
      ok += 1;
    } else {
      console.warn("✗ 13-admin-request-detail-ar.png — no booking request id available");
    }
  }

  await browser.close();
  console.log(`\nCaptured ${ok}/${total} screenshots → ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
