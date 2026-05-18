# دليل التثبيت والتشغيل — إدارة الحجر الصحي بالقاهرة

**Cairo Quarantine Management (CQM)** — دليل كامل للتطوير المحلي وللنشر على VPS مع Next.js على Vercel.

| البيئة | الواجهة | البيانات التشغيلية | البنية التحتية |
|--------|---------|---------------------|----------------|
| محلي — وضع أ | Next.js فقط | Firestore | Firebase |
| محلي — وضع ب | Next + API + Worker | PostgreSQL + Redis | `docker-compose.dev.yml` |
| إنتاج | Vercel (Next) | PostgreSQL على VPS | `docker-compose.yml` + Caddy |

---

## الجزء 1 — المتطلبات والتثبيت الأولي

### 1.1 البرمجيات المطلوبة

| الأداة | الإصدار المقترح | الاستخدام |
|--------|-----------------|-----------|
| **Git** | أي إصدار حديث | استنساخ المستودع |
| **Node.js** | 20 LTS أو **22** (مطابق لصور Docker) | Next.js، سكربتات البذر، تشغيل API/Worker محلياً |
| **npm** | يأتي مع Node | تثبيت الحزم |
| **Docker** + **Docker Compose** v2 | حديث | Postgres + Redis (محلي)، أو المكدس الكامل (VPS) |

تحقق سريع:

```bash
node -v    # v20.x أو v22.x
npm -v
docker -v
docker compose version
```

### 1.2 استنساخ المستودع

```bash
git clone https://github.com/YOUR_ORG/Cairo-Quarantine-Management.git
cd Cairo-Quarantine-Management
```

### 1.3 تثبيت حزم المشروع

**الجذر (تطبيق Next.js):**

```bash
npm install
```

**حزم الخدمات الخلفية** (مطلوبة لوضع PostgreSQL المحلي أو للبناء داخل Docker):

```bash
cd services/shared && npm install && npm run build && cd ../..
cd services/api && npm install && cd ..
cd services/worker && npm install && cd ../..
```

> الحزمة `@cqm/shared` تُبنى أولاً؛ تعتمد عليها `services/api` و`services/worker`.

### 1.4 ملفات البيئة (قوالب — لا ترفع الأسرار)

| الملف | الاستخدام |
|-------|-----------|
| [`.env.example`](../.env.example) | انسخه إلى **`.env.local`** للتطوير على الجهاز |
| [`.env.vps.example`](../.env.vps.example) | انسخه إلى **`.env`** بجانب `docker-compose.yml` على VPS |

```bash
cp .env.example .env.local    # محلي
# على VPS:
cp .env.vps.example .env
```

**لا تُرفع** `.env.local` أو `.env` إلى Git. لا تُدرج مفاتيح Firebase أو `ADMIN_API_SECRET` في التوثيق أو الـ commits.

---

## الجزء 2 — التشغيل المحلي

### 2A — Next.js + Firestore فقط (بدون VPS API)

الوضع الافتراضي التاريخي: كل منطق الطلبات والطابور على Firestore عبر Firebase Admin SDK.

1. أنشئ مشروع Firebase وفعّل **Email/Password** في Authentication.
2. املأ `.env.local` من `.env.example` (متغيرات `NEXT_PUBLIC_FIREBASE_*` و`FIREBASE_*`).
3. انشر `firestore.rules` والفهارس من [`firestore.indexes.json`](../firestore.indexes.json) عند الحاجة.
4. اضبط:

```env
USE_VPS_API=false
# لا حاجة لـ CQM_API_URL أو DATABASE_URL في هذا الوضع
```

5. بذر Firestore (مرة واحدة أو عند التحديث):

```bash
npm run seed:offices
npm run seed:traveler-states
npm run seed:vaccines
```

6. أول مستخدم إداري:

```bash
npm run admin:create-profile -- <firebase-uid> admin@example.com "Super Admin"
```

7. تشغيل الواجهة:

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) → يُوجَّه إلى `/ar`. لوحة الإدارة: `/ar/admin/login`، الحجز: `/ar/booking`.

**Cron محلي (اختياري):** استدعاءات `POST /api/queue/notify-scan` و`POST /api/admin/maintenance/retention` بأسرار `QUEUE_NOTIFY_CRON_SECRET` و`MAINTENANCE_CRON_SECRET` — تُستبدل بـ worker على VPS بعد القطع.

---

### 2B — Docker dev + API + Worker + Next مع `USE_VPS_API`

مكدس محلي: **Postgres + Redis** في Docker؛ **API** و**Worker** و**Next** على المضيف (ثلاث نوافذ طرفية).

#### المنافذ | Ports

| الخدمة | المنفذ |
|--------|--------|
| Next.js | `3000` |
| API (Fastify) | `3001` |
| PostgreSQL | `5432` |
| Redis | `6379` |

#### الخطوة 1 — قاعدة البيانات والتخزين المؤقت

```bash
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml ps
```

عند **أول** إنشاء مجلد البيانات، يُنفَّذ تلقائياً محتوى [`services/db/migrations/`](../services/db/migrations/) (`001_initial_schema.sql` ثم `002_queue_watches.sql`).

#### الخطوة 2 — متغيرات `.env.local` (قائمة مرجعية)

```env
# Firebase — مطلوب لتسجيل دخول الإدارة و FCM
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# VPS API — يجب أن يتطابق ADMIN_API_SECRET مع خدمة API
USE_VPS_API=true
CQM_API_URL=http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
ADMIN_API_SECRET=ضع-سراً-طويلاً-للتطوير

# PostgreSQL (مطابق docker-compose.dev.yml)
DATABASE_URL=postgres://cqm:cqm_dev_password@localhost:5432/cqm

# اختياري
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
```

شرط التفعيل في الكود ([`lib/api/vps-config.ts`](../lib/api/vps-config.ts)):

- `USE_VPS_API=true`
- `CQM_API_URL` أو `NEXT_PUBLIC_API_BASE_URL` غير فارغ

#### الخطوة 3 — بذر البيانات المرجعية في PostgreSQL

```bash
npm run seed:pg
```

يملأ: المكاتب، حالات المسافرين، اللقاحات (من [`db/seed/reference-data.mjs`](../db/seed/reference-data.mjs)).

#### الخطوة 4 — ثلاث نوافذ طرفية

**الطرفية 1 — API**

```bash
cd services/shared && npm run build && cd ../api
export DATABASE_URL=postgres://cqm:cqm_dev_password@localhost:5432/cqm
export REDIS_URL=redis://localhost:6379
export API_PORT=3001
export API_HOST=127.0.0.1
export ADMIN_API_SECRET=ضع-نفس-السر-كما-في-env-local
export CORS_ORIGINS=http://localhost:3000
npm run dev
```

**الطرفية 2 — Worker**

```bash
cd services/worker
export DATABASE_URL=postgres://cqm:cqm_dev_password@localhost:5432/cqm
export REDIS_URL=redis://localhost:6379
export USE_VPS_API=true
export WORKER_TICK_MS=120000
export WORKER_RETENTION_EVERY_TICKS=6
# FCM (نفس مشروع Firebase):
export FIREBASE_PROJECT_ID=
export FIREBASE_CLIENT_EMAIL=
export FIREBASE_PRIVATE_KEY=
npm run dev
```

**الطرفية 3 — Next.js**

```bash
# من جذر المستودع — يقرأ .env.local تلقائياً
npm run dev
```

#### فحوصات الصحة المحلية

```bash
curl -s http://localhost:3001/health
curl -s http://localhost:3001/health/ready
curl -s "http://localhost:3001/v1/booking-availability?officeId=OFFICE_ID&preferredDate=2026-05-20"
```

استبدل `OFFICE_ID` بمعرّف مكتب من جدول `offices` بعد `seed:pg` (أو استعلم: `docker compose -f docker-compose.dev.yml exec postgres psql -U cqm -d cqm -c "SELECT id FROM offices LIMIT 3;"`).

#### ترحيل بيانات حية من Firestore (اختياري)

```bash
npm run migrate:firestore-to-pg
```

يتطلب Firebase Admin و`DATABASE_URL` في `.env.local`.

---

## الجزء 3 — النشر على VPS

### 3.1 متطلبات الخادم

- **Ubuntu** 22.04/24.04 (أو توزيعة مماثلة)
- **Docker** + **Compose** plugin
- **Git** لسحب المستودع
- **جدار ناري:** افتح **22** (SSH)، **80** و**443** (Caddy / Let's Encrypt)
- **DNS:** سجل `A` / `AAAA` لنطاق API (مثال: `api.example.com`) يشير إلى IP الـ VPS

### 3.2 إعداد المستودع والبيئة

```bash
sudo mkdir -p /opt/cqm && sudo chown "$USER":"$USER" /opt/cqm
cd /opt/cqm
git clone https://github.com/YOUR_ORG/Cairo-Quarantine-Management.git .
cp .env.vps.example .env
nano .env   # أو محررك المفضل
```

**متغيرات حرجة في `.env`:**

| المتغير | الوصف |
|---------|--------|
| `POSTGRES_PASSWORD` | كلمة مرور قوية لـ PostgreSQL |
| `ADMIN_API_SECRET` | سر طويل عشوائي — **نفس القيمة** على Vercel |
| `CORS_ORIGINS` | أصل تطبيق Vercel، مثال: `https://your-app.vercel.app` |
| `CADDY_ACME_EMAIL` | بريد Let's Encrypt |
| `USE_VPS_API` | `true` على VPS (للـ worker وقراءة `queue_watches` من PG) |
| `FIREBASE_*` | مطلوب للـ worker لإرسال **FCM** |

### 3.3 Caddy واسم النطاق

عدّل [`infra/caddy/Caddyfile`](../infra/caddy/Caddyfile):

```
api.your-domain.gov.eg {
    reverse_proxy api:3001
    ...
}
```

استبدل `api.example.com` بنطاقك الفعلي.

### 3.4 تشغيل المكدس

```bash
cd /opt/cqm
docker compose up -d --build
docker compose ps
docker compose logs -f api
```

الخدمات: `postgres`, `redis`, `api`, `worker`, `caddy`.

### 3.5 الهجرات (migrations)

| الحالة | ماذا يحدث |
|--------|-----------|
| **أول تشغيل** (مجلد Postgres فارغ) | يُنفَّذ `001` و`002` تلقائياً من `/docker-entrypoint-initdb.d` |
| **حجم بيانات قديم** (قبل إضافة `002`) | نفّذ يدوياً على الـ VPS: |

```bash
cd /opt/cqm
docker compose exec -T postgres psql -U cqm -d cqm \
  < services/db/migrations/002_queue_watches.sql
```

تحقق:

```bash
docker compose exec postgres psql -U cqm -d cqm -c "\dt queue_watches"
```

### 3.6 بذر PostgreSQL (`npm run seed:pg`)

على VPS **لا يُعرَض** منفذ Postgres للخارج. خيارات التشغيل:

**أ) من المضيف** (Node مثبت على VPS، بعد `npm install` في الجذر):

```bash
cd /opt/cqm
set -a && source .env && set +a
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}"
# مؤقتاً: أضف ports: "5432:5432" تحت postgres في override، أو استخدم الخيار ب
npm run seed:pg
```

**ب) عبر شبكة Docker** (بدون فتح المنفذ):

```bash
cd /opt/cqm
set -a && source .env && set +a
docker run --rm \
  --network "$(basename "$(pwd)")_cqm_internal" \
  -v "$(pwd):/app" -w /app \
  -e "DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}" \
  node:22-alpine sh -lc "node scripts/seed/pg-reference-data.mjs"
```

> اسم الشبكة قد يختلف حسب اسم مجلد المشروع؛ تحقق بـ `docker network ls | grep cqm`.

**ج) ترحيل بيانات إنتاج من Firestore:**

```bash
# من جهاز لديه Firebase + وصول DATABASE_URL عبر نفق SSH إن لزم
npm run migrate:firestore-to-pg
```

### 3.7 متغيرات Vercel (الواجهة)

| المتغير | القيمة |
|---------|--------|
| `USE_VPS_API` | `true` |
| `CQM_API_URL` | `https://api.your-domain.gov.eg` (بدون `/` في النهاية) |
| `ADMIN_API_SECRET` | **مطابق** لـ VPS `.env` |
| `NEXT_PUBLIC_API_BASE_URL` | نفس عنوان API إن احتجت العميل |
| `NEXT_PUBLIC_FIREBASE_*` + `FIREBASE_*` | **ابقَ على Firebase** — Auth للإدارة + FCM |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Web Push للطابور |

احتفظ بباقي متغيرات `.env.example` (واتساب، `NEXT_PUBLIC_SITE_URL`, إلخ).

### 3.8 إيقاف Cron على Vercel بعد القطع

بعد `USE_VPS_API=true` على Vercel والـ VPS:

- **أوقف** جدولة Vercel لـ:
  - `POST /api/queue/notify-scan`
  - `POST /api/admin/maintenance/retention`
- الـ **worker** ينفّذ `queue-notify-scan` و`retention` داخل الحاوية (`WORKER_TICK_MS`, `WORKER_RETENTION_EVERY_TICKS`).

راجع [`scripts/cron.example`](../scripts/cron.example).

### 3.9 نسخ احتياطي على الخادم (host cron)

1. املأ في `.env`: `S3_*`, `BACKUP_RETENTION_DAYS`, و`DATABASE_URL` للنسخ الاحتياطي (يمكن بناؤه من متغيرات Postgres).
2. ثبّت `pg_dump` و`aws` CLI على VPS.
3. أضف إلى `crontab -e` (مثال من `scripts/cron.example`):

```cron
0 2 * * * cd /opt/cqm && set -a && source .env && set +a && ./scripts/backup/pg-dump-to-s3.sh >> /var/log/cqm-backup.log 2>&1
```

اختبار اختياري للاستعادة: [`scripts/backup/restore-test.sh`](../scripts/backup/restore-test.sh).

---

## الجزء 4 — التحقق والاختبار

### 4.1 صحة API (عبر Caddy أو محلياً)

```bash
export API_BASE=https://api.your-domain.gov.eg   # أو http://localhost:3001

curl -s "$API_BASE/health" | jq .
curl -s "$API_BASE/health/ready" | jq .
```

`health/ready` يجب أن يُظهر `database.ok` و`redis.ok`.

### 4.2 دخان — حجز وتوفر

```bash
curl -s "$API_BASE/v1/booking-availability?officeId=OFFICE_ID&preferredDate=2026-05-20"
```

### 4.3 دخان — إنشاء طلب (عام)

```bash
curl -s -X POST "$API_BASE/v1/requests" \
  -H "Content-Type: application/json" \
  -d '{
    "governorateId": "cairo",
    "officeId": "OFFICE_ID",
    "type": "complaint",
    "name": "اختبار",
    "phone": "01000000000",
    "details": "smoke test"
  }'
```

### 4.4 دخان — مسار إداري

```bash
export ADMIN_API_SECRET=your-secret

curl -s "$API_BASE/v1/admin/requests?role=super_admin&limit=5" \
  -H "Authorization: Bearer $ADMIN_API_SECRET"
```

### 4.5 دخان — عبر Next (بعد النشر أو محلياً)

| المسار | الغرض |
|--------|--------|
| `GET /api/booking/availability?officeId=...&preferredDate=YYYY-MM-DD` | يمر عبر VPS عند `USE_VPS_API=true` |
| `/ar/booking` | نموذج حجز |
| `/ar/checkin` | تسجيل حضور الطابور |
| `/ar/admin/login` | Firebase Auth |

---

## الجزء 5 — استكشاف الأخطاء

| العرض | السبب المحتمل | الحل |
|--------|----------------|------|
| الطلبات لا تُحفظ / 503 من الإدارة | `USE_VPS_API=true` لكن `CQM_API_URL` فارغ | اضبط `CQM_API_URL` و`USE_VPS_API=true` معاً ([`vps-config.ts`](../lib/api/vps-config.ts)) |
| `401` على `/v1/admin/*` | `ADMIN_API_SECRET` غير متطابق | وحّد السر بين Vercel و`.env` على VPS |
| `seed:pg` يفشل: `Missing DATABASE_URL` | السطر معلّق أو غير مضبوط | فعّل `DATABASE_URL=postgres://...` في `.env.local` |
| Postgres «connection refused» محلياً | Docker dev غير شغّال | `docker compose -f docker-compose.dev.yml up -d` |
| `health/ready` → database فاشل | كلمة مرور/اسم DB خاطئ | طابق `DATABASE_URL` مع `docker-compose.dev.yml` |
| جدول `queue_watches` غير موجود | مجلد PG قديم قبل `002` | نفّذ `002_queue_watches.sql` يدوياً (القسم 3.5) |
| CORS من المتصفح | `CORS_ORIGINS` لا يتضمن Vercel | أضف أصل التطبيق في `.env` VPS |
| شهادة TLS لا تُصدر | منافذ 80/443 مغلقة أو DNS خاطئ | افتح الجدار؛ تحقق من `A`/`AAAA` |
| إشعارات الطابور لا تصل | Firebase غير مضبوط على worker | `FIREBASE_*` في `.env` VPS + `NEXT_PUBLIC_FIREBASE_VAPID_KEY` |
| المكاتب فارغة في الحجز لكن PG مزروع | **قائمة المكاتب للعرض ما زالت من Firestore** | شغّل `npm run seed:offices` على Firebase **أو** انتظر ربط القراءة بـ PG |
| `npm run seed:pg` من VPS: لا اتصال | Postgres غير معرّض | استخدم `docker run` على شبكة `cqm_internal` (القسم 3.6ب) |
| Worker لا يبدأ | `DATABASE_URL` / `REDIS_URL` ناقص داخل الحاوية | راجع `docker compose logs worker` |

---

## الجزء 6 — ما يبقى على Firestore بعد القطع الجزئي

عند `USE_VPS_API=true`، تنتقل **البيانات التشغيلية الثقيلة** إلى PostgreSQL على VPS:

| على PostgreSQL (VPS API) | ما زال على Firebase / Firestore |
|--------------------------|--------------------------------|
| طلبات المكاتب (`requests`) | **مصادقة الإدارة** (Firebase Auth) |
| الطابور (`queue_tickets`) | **ملفات المستخدمين الإداريين** (`user_profiles`) |
| سجل النشاط (`activity_logs`) | **قراءة المكاتب** للواجهات العامة والإدارة (`offices`) |
| `queue_watches` (مع migration 002) | **اللقاحات وحالات المسافرين** (إدارة + عرض من Firestore) |
| إحصاء الحجز اليومي عبر API | **`settings/app`** (ساعة قطع حجز نفس اليوم) |
| تصدير الطلبات الكبير للسوبر أدمن | **أدوات السوبر أدمن** (تصدير/استيراد/حذف مجموعات Firestore) |
| Check-in والطابور عبر VPS | **إشعار الطلبات الجديدة الفوري** (`AdminNewRequestNotifier` — مستمع Firestore) |
| | **FCM** (Firebase Cloud Messaging) — المفاتيح من Firebase Console |
| | **عداد زوار الموقع** (`siteVisitors` في Firestore) |
| | **استعلام حالة الطلب العام** (`getPublicRequestStatus`) — ما زال Firestore |
| | **بعض التحديثات الإدارية** (مثل `markWhatsappSent`) — Firestore |
| | **أرشفة retention اختيارية** لمجموعات Firestore أثناء الانتقال (worker) |

**ملاحظة:** بذر `npm run seed:pg` يملأ PostgreSQL للاختبار والـ API؛ واجهة Next ما زالت تقرأ **قائمة المكاتب** من Firestore في [`lib/office-requests/store.ts`](../lib/office-requests/store.ts) ما لم تُفعَّل قراءة من PG لاحقاً. للإنتاج المتسق: إمّا الإبقاء على `seed:offices` في Firebase، أو التخطيط لتوحيد مصدر القراءة.

**محتوى ثابت في الكود:** جدول اللقاحات في [`data/vaccines.ts`](../data/vaccines.ts) للصفحة الرئيسية؛ منفصل عن مجموعة Firestore `vaccines`.

---

## مراجع سريعة

| المورد | المسار |
|--------|--------|
| Compose إنتاج | [`docker-compose.yml`](../docker-compose.yml) |
| Compose تطوير DB | [`docker-compose.dev.yml`](../docker-compose.dev.yml) |
| هجرات SQL | [`services/db/migrations/`](../services/db/migrations/) |
| API عام / إداري | [`services/api/src/routes/v1/`](../services/api/src/routes/v1/) |
| Worker | [`services/worker/src/index.ts`](../services/worker/src/index.ts) |
| نقاط النهاية (Next) | [`BACKEND_ENDPOINTS.md`](../BACKEND_ENDPOINTS.md) |
| شرط VPS | [`lib/api/vps-config.ts`](../lib/api/vps-config.ts) |

---

*آخر تحديث للدليل: يعكس هيكل المستودع الحالي (Next 16، خدمات `services/*`، قطع جزئي Firestore → PostgreSQL).*
