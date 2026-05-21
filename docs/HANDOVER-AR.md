# مستند تسليم المشروع (Handover)
## بوابة إدارة الحجر الصحي بالقاهرة — Cairo Quarantine Administration

| البند | القيمة |
|-------|--------|
| **اسم المشروع (تقني)** | `cairo-portal` |
| **الإصدار** | 0.1.0 |
| **تاريخ المستند** | مايو 2026 |
| **الجمهور** | مطوّر جديد، الجهة المنفذة، فريق التشغيل |
| **مستند إداري مكمّل** | [`docs/ADMIN-BRIEF-AR.md`](ADMIN-BRIEF-AR.md) |
| **نسخة Word (مع الصور)** | [`docs/HANDOVER-AR.docx`](HANDOVER-AR.docx) — توليد: `npm run handover:docx` |
| **عرض تقديمي PDF** | [`docs/Cairo-Quarantine-Presentation.pdf`](Cairo-Quarantine-Presentation.pdf) — `npm run handover:pdf` |

---

## فهرس المحتويات

1. [ملخص تنفيذي](#1-ملخص-تنفيذي)
2. [التقنيات والبنية](#2-التقنيات-والبنية)
3. [الفرونت إند](#3-الفرونت-إند)
4. [الباك إند وواجهات API](#4-الباك-إند-وواجهات-api)
5. [قاعدة البيانات والأمان](#5-قاعدة-البيانات-والأمان)
6. [الصفحات والمسارات (24 صفحة)](#6-الصفحات-والمسارات)
7. [رحلات المستخدم والأكشنات](#7-رحلات-المستخدم-والأكشنات)
8. [السعة وحدود الطلبات](#8-السعة-وحدود-الطلبات)
9. [لقطات الشاشة](#9-لقطات-الشاشة)
10. [التشغيل المحلي والنشر](#10-التشغيل-المحلي-والنشر)
11. [قائمة تسليم للمطوّر الجديد](#11-قائمة-تسليم-للمطوّر-الجديد)

---

## 1. ملخص تنفيذي

منصة ويب **متعددة اللغات** (عربي افتراضي، إنجليزي، صيني) لإدارة الحجر الصحي بالقاهرة. تجمع بين:

| المحور | الوصف |
|--------|--------|
| **محتوى إرشادي** | خدمات المسافرين، اللقاحات، المكاتب، روابط رسمية، ميثاق التطعيمات |
| **مساعد المنصة** | شات عائم (عربي/متعدد اللغات) — إجابات من بيانات الموقع فقط |
| **حجز مواعيد** | نموذج إلكتروني → رقم طلب + بطاقة QR + PNG |
| **شكاوى ومقترحات** | مرتبطة بمكتب محدد |
| **طابور حضور يومي** | تسجيل عند المكتب (QR) + متابعة الدور |
| **لوحة إدارة** | طلبات، إحصاءات، كتالوجات، مستخدمين، تصدير، أرشفة |

```mermaid
flowchart TB
  subgraph public [الواجهة العامة]
    Info[صفحات إرشادية]
    Book[حجز /booking]
    Comp[شكوى /complaint]
    Pass[بطاقة QR]
    MyReq[طلباتي]
    Checkin[تسجيل حضور]
  end
  subgraph admin [لوحة الإدارة]
    Dash[لوحة إحصاءات]
    Req[الطلبات]
    Queue[الطوابير]
    Cat[كتالوجات]
  end
  Next[Next.js Server]
  FS[(Firestore)]
  Info --> Book
  Book --> Next --> FS
  Comp --> Next
  Checkin --> Next
  FS --> Req
  FS --> Queue
```

**نقطة معمارية حاسمة:** طلبات الجمهور (حجز/شكوى) تُنشأ عبر **Server Actions** و**Firebase Admin SDK** على الخادم — لا يُنشئ الزائر وثائقاً مباشرة في Firestore من المتصفح.

---

## 2. التقنيات والبنية

### 2.1 Stack

| الطبقة | التقنية | الإصدار (تقريبي) |
|--------|---------|------------------|
| Framework | Next.js (App Router) | 16.2.6 |
| UI | React | 19.2.4 |
| تنسيق | Tailwind CSS | 4 |
| لغة | TypeScript | 5 |
| Auth (إدارة) | Firebase Auth | 12.x |
| قاعدة البيانات | Cloud Firestore | — |
| Server SDK | firebase-admin | 13.x |
| رسوم بيانية | Recharts | 2.15 |
| QR / PDF | qrcode, jspdf, html2canvas | — |
| Excel | ExcelJS | 4.4 |
| اختبارات | Vitest | 3.2 |

### 2.2 هيكل المجلدات

```
app/
  [locale]/(public)/          # 10 صفحات للمواطن
  [locale]/admin/             # 13 صفحة إدارة + login + pending
  [locale]/office-dashboard/  # طابور مكتب واحد
  api/                        # 17 REST route
components/                   # واجهات (booking, admin, queue, home...)
lib/
  office-requests/            # منطق الطلبات والتخزين
  queue/                      # الطابور والحضور
  firebase/                   # عميل ويب + Admin SDK
  i18n/                       # messages.ts (3 لغات)
data/                         # مكاتب ثابتة، محافظات
scripts/                      # seed، load-test، admin profile
docs/
  HANDOVER-AR.md              # هذا الملف
  ADMIN-BRIEF-AR.md
  handover/screenshots/       # لقطات الشاشة
firestore.rules
firestore.indexes.json
proxy.ts                      # توجيه الجذر → /ar
```

### 2.3 اللغات

| اللغة | المسار | الاتجاه |
|-------|--------|---------|
| العربية (افتراضي) | `/ar` | RTL |
| English | `/en` | LTR |
| 中文 | `/zh` | LTR |
| Français | `/fr` | LTR |

- محتوى الموقع الرئيسي (بطاقات، عناوين، جداول): **مترجم** في `lib/i18n/messages.ts`.
- **نماذج الحجز والشكوى:** مترجمة عبر `lib/i18n/booking-request-copy.ts` حسب `locale`.
- **تسجيل الحضور (`/checkin`):** مترجم عبر `lib/i18n/checkin-copy.ts`.
- **لوحة الإدارة:** عربية مقصودة (تشغيل محلي).
- **بطاقة الحجز (QR):** مترجمة حسب `locale` في الرابط.

---

## 3. الفرونت إند

### 3.1 مسؤوليات الواجهة

| المسؤولية | التفاصيل |
|-----------|----------|
| عرض المحتوى | Server Components تقرأ من Firestore (مكاتب، لقاحات، دول، إعدادات) |
| نماذج تفاعلية | Client Components: حجز، شكوى، حضور، لوحة إدارة |
| تخزين محلي | `localStorage` في «طلباتي» (آخر 20 طلباً) |
| استدعاء APIs | توفر الحجز، حالة الطلبات، موضع الطابور |
| PWA | Service Worker + بطاقة تثبيت |
| إمكانية الوصول | قراءة النص (TTS) عائمة |
| QR على العميل | توليد وعرض رمز الحجز + تصدير PNG |

### 3.2 مكونات رئيسية

| المجلد | أمثلة |
|--------|-------|
| `components/home/` | `HeroSection`, `ServiceCards`, `VaccineSelector` |
| `components/booking/` | `BookingRequestForm`, `BookingPassSuccessBlock` |
| `components/queue/` | `CheckinForm`, `OfficeQueuePanel`, `QueueWaitLive` |
| `components/admin/` | `AdminDashboard`, `AdminRequestsTable`, `RequestDetail` |
| `components/international/` | `DestinationCountryRequirementsPicker` |
| `components/layout/` | `SiteHeader`, أزرار واتساب/حجز عائمة |

### 3.3 Server Actions (واجهة ↔ خادم)

| الملف | الوظائف |
|-------|---------|
| `app/[locale]/(public)/booking/actions.ts` | `submitOfficeRequest` — حجز/شكوى/مقترح |
| `app/[locale]/(public)/checkin/actions.ts` | تسجيل حضور، بحث طلب، طابور سريع |
| `app/[locale]/admin/actions.ts` | تحديث طلب، واتساب، مكاتب، مستخدمين، قوالب، أرشفة |
| `app/[locale]/office-dashboard/.../queue/actions.ts` | إدارة تذاكر الطابور |

---

## 4. الباك إند وواجهات API

### 4.1 مسؤوليات الخادم

- التحقق من صحة المدخلات وسعة الحجز اليومية.
- إنشاء/تحديث وثائق Firestore عبر Admin SDK.
- جلسة الإدارة (Cookie `cqm_admin_session`).
- حدود المعدل (Rate limiting) على المسارات العامة.
- تصدير Excel وNDJSON، أرشفة من اللوحة (بدون Vercel Cron).

### 4.2 REST API — 17 مسار

| Method | المسار | الوظيفة | من يستخدمه |
|--------|--------|---------|------------|
| GET | `/api/booking/availability` | هل اليوم ممتلئ للمكتب؟ | نموذج الحجز |
| POST | `/api/office-requests/status` | تحديث حالة «طلباتي» | `MyRequestsPanel` |
| GET | `/api/queue/position` | موضع تذكرة الطابور | صفحة الانتظار |
| GET | `/api/queue/watch` | polling الطابور | عميل الطابور |
| POST | `/api/queue/notify-scan` | إشعار مسح QR | لوحة المكتب |
| POST | `/api/admin/session` | إنشاء جلسة إدارة | بعد Firebase login |
| POST | `/api/admin/logout` | خروج | لوحة الإدارة |
| POST | `/api/admin/firebase-custom-token` | توكن مخصص | عميل Firebase |
| GET | `/api/firebase/public-config` | إعدادات Firebase العامة | عميل الويب |
| GET | `/api/admin/requests/export` | تصدير `.xlsx` (سريع: حالة + تاريخ الحجز؛ متقدم: أنواع/مكتب/فئة/تاريخ الإنشاء) | لوحة الطلبات |
| POST | `/api/admin/queue/close` | إغلاق طابور يوم | طابور المكتب |
| POST | `/api/admin/maintenance/retention` | أرشفة | سوبر أدمن من اللوحة أو Bearer اختياري |
| POST | `/api/admin/destination-countries/import` | استيراد دول Excel | سوبر أدمن |
| GET | `/api/admin/destination-countries/template` | قالب Excel | سوبر أدمن |
| GET | `/api/admin/destination-countries/export` | تصدير `.xlsx` للدول الحالية | سوبر أدمن |
| GET/POST | `/api/admin/offices/excel/*` | تصدير/معاينة/استيراد مكاتب Excel | سوبر أدمن |
| GET/POST | `/api/admin/vaccines/excel/*` | تصدير/معاينة/استيراد تطعيمات Excel | سوبر أدمن |
| GET/POST | `/api/admin/templates/excel/*` | تصدير/معاينة/استيراد قوالب Excel | سوبر أدمن |
| GET/POST | `/api/admin/firestore/collection-export` | تصدير NDJSON | سوبر أدمن |
| POST | `/api/admin/firestore/collection-import` | استيراد NDJSON | سوبر أدمن |
| POST | `/api/admin/firestore/collection-purge` | تنظيف مجموعة | سوبر أدمن |
| POST | `/api/chat` | مساعد المنصة (SSE، بدون LLM) | ويدجت الشات العام |

### 4.3 مساعد المنصة (`/api/chat`)

| البند | التفاصيل |
|-------|----------|
| **المصدر الوحيد** | نصوص i18n + `data/*` + Firestore (مكاتب، لقاحات، دول) — **لا OpenRouter ولا معرفة عامة** |
| **المنطق** | `resolvePortalAssistant` في `lib/chat/portal-assistant.ts` — نيات محلية (سعر، مكتب، حج، حجز…) + بحث فهرس `site-knowledge` |
| **عند غياب الجواب** | «تعذر العثور على المعلومات داخل المنصة…» + رابط واتساب الشكاوى |
| **الإخراج للواجهة** | SSE نصي؛ الحدث الأخير يتضمن `meta`: `{ source, type, confidence }` (داخلي في `sessionStorage`، لا يُعرض للزائر) |
| **معدل الطلبات** | 20 طلب/دقيقة لكل IP (`scope: chat`) |

### 4.4 Server Actions — الإدارة (ملخص)

| Action | الوظيفة |
|--------|---------|
| `updateRequestAction` | تغيير الحالة والملاحظات |
| `markWhatsappSentAction` | تسجيل تواصل واتساب → `contacted` |
| `addRequestToQueueAction` | إضافة حجز للطابور من قائمة الطلبات |
| `saveOfficeAction` / `setOfficeActiveAction` | إدارة المكاتب |
| `saveTravelerStateAction` | حالات المسافرين |
| `saveVaccineAction` | اللقاحات |
| `saveUserProfileAction` | مستخدمي اللوحة |
| `saveBookingSettingsAction` | ساعة قطع الحجز |
| `saveTemplateAction` | قوالب واتساب |
| `runRetentionMaintenanceAction` | أرشفة يدوية |
| `deleteRequestSuperAdminAction` | حذف طلب (تأكيد برقم الطلب) |

---

## 5. قاعدة البيانات والأمان

### 5.1 مجموعات Firestore

| المجموعة | الغرض |
|----------|--------|
| `requests` | حجوزات، شكاوى، مقترحات |
| `offices` | مكاتب التطعيم (يشمل `workingHoursTwentyFourSeven`, `workingHoursFrom`, `workingHoursTo`, `workingHoursExceptAr`) |
| `traveler_states` | حالات المسافر (قائمة الحجز) |
| `vaccines` | اللقاحات والأسعار |
| `destination_countries` | متطلبات دول الوجهة |
| `users` | ملفات مستخدمي اللوحة (مرتبطة بـ Firebase UID) |
| `messageTemplates` | قوالب واتساب |
| `activityLogs` | سجل تدقيق |
| `settings/app` | ساعة قطع حجز نفس اليوم |
| `queueTickets` | تذاكر الطابور اليومي |
| `booking_duplicates` | منع حجز مكرر |
| `requestsArchive` / `activityLogsArchive` | أرشيف |

### 5.2 أدوار الإدارة

| الدور | النطاق |
|-------|--------|
| `super_admin` | كل المكاتب، كل الكتالوجات، إعدادات، سجل نشاط، حذف |
| `governorate_admin` | مكاتب في `allowedOfficeIds` + مستخدمي مكتب ضمنها |
| `office_admin` | نفس فكرة أدمن مكاتب متعددة |
| `office_user` | مكتب واحد (`officeId`) — الرئيسية `/admin` تحليلات المكتب؛ الطابور عبر «طابور اليوم» أو `/admin/queue` |

حساب غير مفعّل أو بدون مكتب → `/admin/pending-review`.

### 5.3 أمان رئيسي

| الآلية | التفاصيل |
|--------|----------|
| جلسة الإدارة | Cookie `httpOnly`، مدة **5 أيام** |
| بطاقة الحجز | `passToken` عشوائي، صلاحية **30 يوماً**، مقارنة timing-safe |
| `noindex` | صفحة البطاقة لا تُفهرس |
| خصوصية | رقم الهاتف **لا يظهر** على صفحة البطاقة العامة |
| Firestore rules | تحديث الطلب من العميل محدود بحقول الحالة والملاحظات فقط للمكتب |
| Rate limit | على APIs العامة (انظر القسم 8) |

---

## 6. الصفحات والمسارات

**المجموع: 24 صفحة** (`app/**/page.tsx`). كلها تحت `/{locale}/` ما لم يُذكر خلاف ذلك.

### 6.1 الواجهة العامة (10)

| # | المسار | نوع | لقطة |
|---|--------|-----|------|
| 1 | `/` | إرشادي + تفاعلي (تنقل) | ![](handover/screenshots/01-public-home-ar.png) |
| 2 | `/international-traveler` | إرشادي + منتقي دولة | ![](handover/screenshots/02-public-international-traveler-ar.png) |
| 3 | `/hajj-umrah` | إرشادي | ![](handover/screenshots/07-public-hajj-umrah-ar.png) |
| 4 | `/citizen-services` | إرشادي | ![](handover/screenshots/08-public-citizen-services-ar.png) |
| 5 | `/charter` | إرشادي | ![](handover/screenshots/09-public-charter-ar.png) |
| 6 | `/booking` | **نموذج حجز** | ![](handover/screenshots/03-public-booking-ar.png) |
| 7 | `/booking/pass/[id]?t=...` | **عرض بطاقة QR** | ![](handover/screenshots/14-public-booking-pass-ar.png) |
| 8 | `/complaint` | **نموذج شكوى/مقترح** | ![](handover/screenshots/04-public-complaint-ar.png) |
| 9 | `/my-requests` | **متابعة محلية** | ![](handover/screenshots/05-public-my-requests-ar.png) |
| 10 | `/checkin?officeId=...` | **تسجيل حضور** | ![](handover/screenshots/06-public-checkin-ar.png) |

**إضافي:** نسخة إنجليزية للرئيسية — ![](handover/screenshots/25-public-home-en.png)  
**جوال:** الرئيسية 390×844 — ![](handover/screenshots/24-public-home-mobile-ar.png)

### 6.2 لوحة الإدارة (14)

| # | المسار | الدور | لقطة |
|---|--------|-------|------|
| 11 | `/admin/login` | الكل | ![](handover/screenshots/10-admin-login-ar.png) |
| 12 | `/admin/pending-review` | حساب معلّق | *(يُلتقط بعد إنشاء حساب غير مفعّل)* |
| 13 | `/admin` | أدمن | ![](handover/screenshots/11-admin-dashboard-ar.png) |
| 14 | `/admin/requests` | أدمن | ![](handover/screenshots/12-admin-requests-ar.png) |
| 15 | `/admin/requests/[id]` | أدمن | ![](handover/screenshots/13-admin-request-detail-ar.png) |
| 16 | `/admin/queue` | سوبر / أدمن محافظة / أدمن مكاتب | ![](handover/screenshots/18-admin-queue-hub-ar.png) |
| 17 | `/office-dashboard/[officeId]/queue` | موظف مكتب | ![](handover/screenshots/19-admin-office-queue-ar.png) |
| 18 | `/admin/offices` | سوبر — جدول + مواعيد عمل + QR قابل للطي | ![](handover/screenshots/15-admin-offices-ar.png) |
| 19 | `/admin/traveler-states` | سوبر | ![](handover/screenshots/23-admin-traveler-states-ar.png) |
| 20 | `/admin/vaccines` | سوبر | ![](handover/screenshots/20-admin-vaccines-ar.png) |
| 21 | `/admin/destination-countries` | سوبر | ![](handover/screenshots/16-admin-destination-countries-ar.png) |
| 22 | `/admin/users` | سوبر / أدمن | ![](handover/screenshots/21-admin-users-ar.png) |
| 23 | `/admin/settings` | سوبر | ![](handover/screenshots/17-admin-settings-ar.png) |
| 24 | `/admin/activity` | سوبر | ![](handover/screenshots/22-admin-activity-ar.png) |

---

## 7. رحلات المستخدم والأكشنات

### 7.1 المواطن — حجز موعد (`/booking`)

**الخطوات:**

1. اختيار **حالة المسافر** (من `traveler_states`).
2. اختيار **المكتب** (نشط + يخدم الحالة).
3. **التاريخ** (تقويم بتوقيت القاهرة `Africa/Cairo`).
4. **الاسم**، **الهاتف**، **ملاحظات** (اختياري)، خيارات ذوي همم / كبار سن.
5. التحقق من **السعة اليومية** (`GET /api/booking/availability`).
6. إرسال → Server Action `submitOfficeRequest`.
7. النجاح: رقم طلب، QR، تحميل PNG، حفظ في «طلباتي».

**قواعد التاريخ:**

| القاعدة | القيمة |
|---------|--------|
| حجز نفس اليوم | مسموح قبل ساعة القطع (افتراضي **14:00**) |
| بعد القطع | أدنى تاريخ = غداً |
| التعديل | من `/admin/settings` (سوبر أدمن) → `settings/app` |

**لا يوجد موافقة/رفض رسمية** — فقط حالات متابعة.

### 7.2 المواطن — شكوى (`/complaint`)

| الفرق عن الحجز | التفاصيل |
|----------------|----------|
| النوع | شكوى أو مقترح |
| التاريخ / حالة مسافر | غير مطلوبين |
| التفاصيل | إلزامية (5–1000 حرف) |
| المكاتب | كل النشطة |

### 7.3 المواطن — طلباتي (`/my-requests`)

| البند | التفاصيل |
|--------|----------|
| التخزين | `localStorage` على الجهاز |
| الحد | آخر **20** طلباً |
| التحديث | `POST /api/office-requests/status` — رقم الطلب + نفس الهاتف |
| QR | يظهر إن بقي `passToken` محفوظاً محلياً |

### 7.4 المواطن — تسجيل حضور (`/checkin`)

- يفتح من **QR المكتب** → `?officeId=cairo-trav-1` (مثال).
- بحث برقم طلب أو هاتف، أو نموذج سريع → تذكرة طابور + موضع انتظار.
- Rate limit: **20** محاولة / 10 دقائق / IP.

### 7.5 موظف المكتب — معالجة طلب

1. استلام من **اللوحة** (`new`) أو **مسح QR** البطاقة.
2. فتح التفاصيل → قالب واتساب → إرسال للعميل.
3. «تسجيل أنه تم التواصل» → `contacted`.
4. تحديث الحالة → `in_progress` → `completed` أو `cancelled`.
5. كل تغيير يُسجَّل في `activityLogs`.

### 7.6 حالات الطلب

```mermaid
stateDiagram-v2
  [*] --> new
  new --> in_progress
  in_progress --> contacted
  contacted --> completed
  contacted --> cancelled
  in_progress --> cancelled
```

| الحالة | المعنى التشغيلي |
|--------|------------------|
| `new` | وصل ولم يُعالج |
| `in_progress` | بدأت المتابعة |
| `contacted` | تم التواصل (واتساب) |
| `completed` | أُغلق بنجاح |
| `cancelled` | أُغلق دون إتمام |

---

## 8. السعة وحدود الطلبات

### 8.1 حدود التطبيق (لكل IP)

| العملية | الحد | النافذة |
|---------|------|---------|
| إرسال طلب (حجز/شكوى) | **10** | 10 دقائق |
| توفر موعد (`/api/booking/availability`) | **60** | دقيقة |
| تحديث «طلباتي» | **30**/دقيقة، max **20** طلب/body | دقيقة |
| تسجيل حضور | **20** | 10 دقائق |
| موضع الطابور | **60** | دقيقة |

متغير `RATE_LIMIT_BACKEND`: `memory` (افتراضي) | `firestore` | `both` — للإنتاج متعدد العُقد يُفضَّل `firestore` أو `both`.

### 8.2 سعة تشغيلية (أعمال)

| البند | الحد |
|-------|------|
| `dailyBookingCap` لكل مكتب | أقصى حجوزات/يوم (`null` = غير محدود) |
| تصدير Excel | **10,000** صف |
| أرشفة دفعة واحدة | **400** وثيقة |
| تصدير NDJSON | **10,000** وثيقة/مجموعة |
| استيراد NDJSON | **2,000** وثيقة/استدعاء |
| تنظيف Purge | **5,000** وثيقة |

### 8.3 اختبار الحمل

```bash
npm run load-test:bookings
# LOAD_TEST_COUNT=100 LOAD_TEST_CONCURRENCY=5 LOAD_TEST_OFFICE_ID=cairo-trav-1
```

يُنشئ حجوزات حقيقية عبر `createOfficeRequest` — **استخدم على staging فقط**.

### 8.4 تقدير السعة الإنتاجية

لا يوجد رقم ثابت «X طلب/ثانية» في الكود. الاعتماد على:

1. **منصة النشر** (Vercel / Node hosting).
2. **حصص Firebase/Firestore**.
3. **سعة المكاتب اليومية** (الحد التشغيلي الفعلي).
4. **Rate limits** (حماية من الإساءة).

بدون Firebase مضبوط: `/api/booking/availability` يعيد `available: true` دائماً — **يجب ضبط Firebase للإنتاج**.

---

## 9. لقطات الشاشة

جميع الصور في: **`docs/handover/screenshots/`** (25 ملف PNG).

| الملف | الوصف |
|-------|--------|
| `01-public-home-ar.png` | الرئيسية — عربي (صفحة كاملة) |
| `02-public-international-traveler-ar.png` | المسافر الدولي + منتقي الدول |
| `03-public-booking-ar.png` | نموذج الحجز |
| `04-public-complaint-ar.png` | شكوى / مقترح |
| `05-public-my-requests-ar.png` | طلباتي |
| `06-public-checkin-ar.png` | تسجيل حضور (مكتب المطار) |
| `07-public-hajj-umrah-ar.png` | الحج والعمرة |
| `08-public-citizen-services-ar.png` | خدمات المواطن |
| `09-public-charter-ar.png` | ميثاق التطعيمات |
| `10-admin-login-ar.png` | تسجيل دخول الإدارة |
| `11-admin-dashboard-ar.png` | لوحة الإحصاءات |
| `12-admin-requests-ar.png` | قائمة الطلبات |
| `13-admin-request-detail-ar.png` | تفاصيل طلب + واتساب |
| `14-public-booking-pass-ar.png` | بطاقة QR (مثال حي) |
| `15-admin-offices-ar.png` | إدارة المكاتب |
| `16-admin-destination-countries-ar.png` | متطلبات الدول |
| `17-admin-settings-ar.png` | الإعدادات وقوالب واتساب |
| `18-admin-queue-hub-ar.png` | مركز طوابير المكاتب |
| `19-admin-office-queue-ar.png` | طابور مكتب واحد |
| `20-admin-vaccines-ar.png` | اللقاحات |
| `21-admin-users-ar.png` | المستخدمون |
| `22-admin-activity-ar.png` | سجل النشاط |
| `23-admin-traveler-states-ar.png` | حالات المسافرين |
| `24-public-home-mobile-ar.png` | الرئيسية — عرض جوال |
| `25-public-home-en.png` | الرئيسية — إنجليزي |

> **تنبيه:** اللقطات من بيئة تطوير محلية وقد تعرض بيانات اختبار حمل. قبل التسليم للجهة المنفذة يُفضَّل إعادة التقاط من **بيئة staging/إنتاج** بعد تنظيف البيانات التجريبية. بعد تحديثات الواجهة (ScrollReveal، لوحة التحليلات، QR مطوي) يُنصح بإعادة التقاط على الأقل: `01`, `07`, `15`, `24`, `25`, `11`.

> **لقطة مفقودة:** `/admin/pending-review` — التقط بعد إنشاء حساب غير مفعّل.

### إعادة التقاط الصور

```bash
npm run dev
# ثم افتح http://localhost:3000/ar واتبع القائمة أعلاه
# عرض سطح المكتب: 1440×900 | الجوال: 390×844
```

---

## 10. التشغيل المحلي والنشر

### 10.1 متطلبات

- Node.js LTS متوافق مع Next.js 16
- مشروع Firebase (Auth + Firestore)
- ملف `.env.local` (انظر `README.md`)

### 10.2 أوامر أساسية

```bash
npm install
npm run dev          # http://localhost:3000 → /ar
npm run build
npm run start
npm run test
npm run seed:offices
npm run seed:vaccines
npm run seed:traveler-states
npm run admin:create-profile -- <firebase-uid> admin@example.com "Super Admin"
```

### 10.3 متغيرات بيئة (مرجع)

| المتغير | الغرض |
|---------|--------|
| `NEXT_PUBLIC_FIREBASE_*` | عميل Firebase (واجهة + login) |
| `FIREBASE_PROJECT_ID` / `CLIENT_EMAIL` / `PRIVATE_KEY` | Admin SDK |
| `NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE` | زر واتساب الشكاوى |
| `MAINTENANCE_CRON_SECRET` | *(اختياري)* سر API الأرشفة — التشغيل المعتاد من اللوحة |
| `RATE_LIMIT_BACKEND` | `memory` \| `firestore` \| `both` |

### 10.4 نشر Firestore

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 10.5 صيانة الأرشفة (إنتاج)

من لوحة السوبر أدمن → الإعدادات المتقدمة → تشغيل صيانة البيانات. *(اختياري)* استدعاء API يدوياً أو من مجدول خارجي — **لا يُستخدم Vercel Cron**.

```http
POST /api/admin/maintenance/retention
Authorization: Bearer {MAINTENANCE_CRON_SECRET}
```

---

## 11. قائمة تسليم للمطوّر الجديد

### 11.1 وصول ومستودع

- [ ] صلاحية Git على المستودع
- [ ] نسخ `.env.local` من مسؤول المشروع (لا تُرفع لـ Git)
- [ ] قراءة `README.md` + هذا الملف + `ADMIN-BRIEF-AR.md`

### 11.2 Firebase

- [ ] مشروع Firebase (Auth Email/Password + Firestore)
- [ ] نشر `firestore.rules` و `firestore.indexes.json`
- [ ] إنشاء أول `super_admin` + `npm run admin:create-profile`
- [ ] تشغيل seed: offices, vaccines, traveler-states

### 11.3 تشغيل واختبار

- [ ] `npm run dev` — اختبار `/ar/booking` كاملاً حتى QR
- [ ] اختبار `/ar/my-requests` بعد حجز
- [ ] تسجيل دخول `/ar/admin/login`
- [ ] تحديث طلب من `/admin/requests/[id]`
- [ ] اختبار `/checkin?officeId=cairo-trav-1`
- [ ] تجربة صيانة الأرشفة من لوحة السوبر أدمن (مرة واحدة على الأقل في بيئة الاختبار)

### 11.4 ملفات مرجعية في الكود

| الموضوع | المسار |
|---------|--------|
| أنواع الطلبات | `lib/office-requests/types.ts` |
| إرسال الحجز | `app/[locale]/(public)/booking/actions.ts` |
| التخزين | `lib/office-requests/store.ts` |
| صلاحيات | `lib/office-requests/admin-access.ts` |
| الطابور | `lib/queue/queue-service.ts` |
| بطاقة QR | `lib/booking-pass-token.ts` |
| Rate limit | `lib/rate-limit-unified.ts` |
| نصوص الواجهة | `lib/i18n/messages.ts` |

### 11.4 حدود معروفة (شفافية)

| الموضوع | التوضيح |
|---------|----------|
| ScrollReveal | الأقسام فوق الطية تظهر فوراً (`initialVisible` + فحص viewport)؛ باقي الأقسام تظهر عند التمرير |
| لوحة التحليلات | الرسوم من قائمة الطلبات المفلترة؛ الإجمالي قد يأتي من `daily_request_stats` عند عدم تفعيل فلتر التاريخ |
| إدارة المكاتب | قسم QR قابل للطي عند أكثر من 6 مكاتب نشطة |
| PWA على الجوال | يظهر بعد تمرير أو 15 ثانية؛ snooze 30 يوماً |
| «طلباتي» | مرتبطة بالجهاز (`localStorage`) |
| لوحة الإدارة | عربية للتشغيل |
| ترجمة «ما عدا» لمواعيد المكاتب | عربي مخصص فقط؛ باقي اللغات من الميثاق |

### 11.5 تسليم للجهة المنفذة (حزمة)

1. هذا المستند (`docs/HANDOVER-AR.md`)
2. `docs/ADMIN-BRIEF-AR.md`
3. مجلد `docs/handover/screenshots/` (أو PDF مُجمّع)
4. `README.md` + قائمة متغيرات البيئة
5. حسابات Firebase وروابط لوحة Firebase Console
6. رابط الإنتاج + بيانات سوبر أدمن (قناة آمنة)

---

*نهاية مستند التسليم — آخر تحديث: مايو 2026*
