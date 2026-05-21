# نشر الإنتاج | Production deployment

## 1. متغيرات البيئة

انسخ [`.env.example`](../.env.example) إلى `.env.local` (محلي) أو أضف المتغيرات في لوحة الاستضافة (Vercel وغيرها).

راجع أيضاً جدول المتغيرات في [`README.md`](../README.md).

## 2. Firebase

```bash
# يقرأ FIREBASE_PROJECT_ID من .env.local تلقائياً
npm run deploy:firestore
```

بديلاً (ربط دائم لـ Firebase CLI):

```bash
firebase use your-project-id
firebase deploy --only firestore:rules,firestore:indexes
```

## 3. بذر البيانات الأولية

```bash
npm run setup:production
```

يتضمن: مكاتب، لقاحات، حالات مسافرين. ثم أنشئ سوبر أدمن:

```bash
npm run admin:create-profile -- <firebase-uid> admin@example.com "Super Admin"
```

## 4. Cron (مهام مجدولة)

على **Vercel**: يُفعَّل تلقائياً عبر [`vercel.json`](../vercel.json). اضبط `MAINTENANCE_CRON_SECRET` و`DAILY_QUEUE_CRON_SECRET` و`QUEUE_NOTIFY_CRON_SECRET` (أو نفس القيمة لـ `CRON_SECRET` مع المسارات الثلاثة). Vercel يرسل طلبات **GET** مع `Authorization: Bearer …`.

على استضافة أخرى، جدّل `POST` مع رأس:

`Authorization: Bearer <SECRET>`

| المسار | المتغير | التكرار المقترح |
|--------|---------|-----------------|
| `/api/admin/maintenance/retention` | `MAINTENANCE_CRON_SECRET` | أسبوعي (أحد 03:00 UTC) |
| `/api/admin/queue/close` | `DAILY_QUEUE_CRON_SECRET` | يومي (23:05 UTC) |
| `/api/queue/notify-scan` | `QUEUE_NOTIFY_CRON_SECRET` | كل 5 دقائق |

## 5. بناء وتشغيل

```bash
npm ci
npm run build
npm run start
```

## 6. بعد النشر

- [ ] `RATE_LIMIT_BACKEND=firestore` أو `both`
- [ ] `/ar/admin/settings` — ساعة قطع حجز نفس اليوم
- [ ] `/ar/admin/offices` — سعة يومية ومكتب المطار 24 ساعة
- [ ] اختبار: حجز → QR → لوحة → طابور → تصدير
- [ ] نسخ احتياطي: [`BACKUP-FIRESTORE.md`](BACKUP-FIRESTORE.md)
