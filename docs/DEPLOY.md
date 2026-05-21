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

## 4. مهام الخلفية (بدون Vercel Cron)

**لا يُستخدم Vercel Cron** في هذا المشروع (تجنّب حدود الخطة المجانية). المسارات التالية تبقى للاستدعاء **اليدوي** أو من مجدول خارجي (GitHub Actions، cron على سيرفر، إلخ) عبر `POST` أو `GET` مع:

`Authorization: Bearer <SECRET>`

| المسار | المتغير (اختياري) | الغرض | بديل تشغيلي |
|--------|-------------------|--------|-------------|
| `/api/admin/maintenance/retention` | `MAINTENANCE_CRON_SECRET` | أرشفة/حذف الطلبات القديمة | من لوحة السوبر أدمن (أدوات البيانات) |
| `/api/admin/queue/close` | `DAILY_QUEUE_CRON_SECRET` | إغلاق طابور اليوم لكل المكاتب | إغلاق الطابور من لوحة المكتب نهاية اليوم |
| `/api/queue/notify-scan` | `QUEUE_NOTIFY_CRON_SECRET` | إشعارات «اقترب دورك» | اختياري؛ يعتمد على polling عند متابعة الطابور |

إن لم تُضبط أسرار الـ Cron، لا حاجة لها — المسارات ترفض الطلبات بدون `Authorization` صحيح فقط.

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
