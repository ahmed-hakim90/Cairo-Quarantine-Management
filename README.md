# إدارة الحجر الصحي بالقاهرة — بوابة الويب

بوابة معلوماتية متعددة اللغات لخدمات الحجر الصحي والمسافرين (مصر — القاهرة)، مبنية بـ [Next.js](https://nextjs.org) (App Router).

**Cairo Quarantine Administration** — multilingual informational portal for quarantine and traveler services.

## الميزات | Features

- **لغات**: العربية (افتراضي)، الإنجليزية، الصينية — مع اتجاه النص RTL/LTR حسب اللغة.
- **صفحات**: الرئيسية، المسافر الدولي، الحج والعمرة، خدمات المواطن.
- **محتوى**: بطاقات الخدمات، دليل اللقاحات والأسعار، إحصاءات المسافرين، روابط مهمة PDF، جدول مواقع المكاتب، زر واتساب عائم (اختياري عبر المتغير البيئي).

## المتطلبات | Prerequisites

- [Node.js](https://nodejs.org/) (يُفضَّل الإصدار المتوافق مع Next.js 16؛ LTS حديث)
- مدير حزم: `npm` أو `pnpm` أو `yarn` أو `bun`

## التشغيل المحلي | Local development

```bash
npm install
npm run dev
```

ثم افتح [http://localhost:3000](http://localhost:3000) — سيتم التوجيه تلقائياً إلى `/ar` (اللغة الافتراضية).

مسارات جاهزة للمعاينة:

- `/ar` — العربية
- `/en` — English
- `/zh` — 中文

## الأوامر | Scripts

| الأمر        | الوظيفة        |
| ------------ | -------------- |
| `npm run dev`    | خادم التطوير   |
| `npm run build`  | بناء الإنتاج   |
| `npm run start`  | تشغيل بعد البناء |
| `npm run lint`   | فحص ESLint     |
| `npm run seed:offices` | استيراد المكاتب إلى Firestore |
| `npm run seed:traveler-states` | زرع حالات المسافرين الثلاث الافتراضية في Firestore |
| `npm run seed:vaccines` | استيراد جدول اللقاحات إلى Firestore |

## متغيرات البيئة | Environment variables

أنشئ ملف `.env.local` في جذر المشروع عند الحاجة:

| المتغير | الوصف |
| ------- | ----- |
| `NEXT_PUBLIC_WHATSAPP_COMPLAINTS_PHONE` | رقم واتساب الشكاوى والاقتراحات (أرقام فقط مع كود الدولة، مثال مصر: `201012345678`). إن لم يُضبط، قد لا يظهر رابط الواتساب بشكل صحيح. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key لتسجيل دخول لوحة الإدارة. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project id للواجهة. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket، إن وجد. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender id. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app id. |
| `FIREBASE_PROJECT_ID` | Firebase project id للـ Admin SDK. |
| `FIREBASE_CLIENT_EMAIL` | service account client email. |
| `FIREBASE_PRIVATE_KEY` | service account private key مع `\n` escaped في `.env.local`. |

إعدادات الحجز العامة (ساعة إغلاق حجز «نفس اليوم» بتوقيت القاهرة) تُحفظ في وثيقة Firestore `settings/app` ويُضبطها السوبر أدمن من `/ar/admin/settings` (افتراضي الساعة 14 إن لم تُنشأ الوثيقة).

### Firebase setup

1. فعّل Firebase Auth بطريقة Email/Password.
2. أضف متغيرات البيئة السابقة.
3. انشر قواعد `firestore.rules` على Firestore.
4. شغّل `npm run seed:offices` لاستيراد المكاتب الحالية إلى Firestore، و`npm run seed:vaccines` لجدول اللقاحات والأسعار (مجموعة `vaccines`).
5. عند استخدام **حد الحجوزات اليومي للمكتب**، أنشئ فهارس Firestore المركّبة المطلوبة (انظر [`firestore.indexes.json`](firestore.indexes.json) ثم `firebase deploy --only firestore:indexes` أو رابط الخطأ من أول استعلام).
6. أنشئ أول مستخدم في Firebase Auth، ثم اربطه كسوبر أدمن:

```bash
npm run admin:create-profile -- <firebase-uid> admin@example.com "Super Admin"
```

بعدها افتح `/ar/admin/login`. رابط الحجز الداخلي أصبح `/ar/booking`.

## هيكل المشروع | Project structure ( مختصر )

```
app/
  [locale]/          # الصفحات حسب اللغة (ar | en | zh)
components/          # واجهات الصفحة والتخطيط
lib/i18n/            # إعدادات اللغات والرسائل (messages)
proxy.ts             # إعادة توجيه الجذر إلى اللغة الافتراضية
```

النصوص الظاهرة للمستخدم موجودة في `lib/i18n/messages.ts` لكل لغة.

## النشر | Deploy

يمكن نشر التطبيق على أي منصة تدعم Next.js، مثل [Vercel](https://vercel.com/docs/frameworks/nextjs). تأكد من ضبط متغيرات البيئة في لوحة التحكم قبل الإنتاج.

## ملاحظة للمساهمين | Note for contributors

هذا المشروع يستخدم Next.js 16؛ راجع وثائق الإصدار الحالية في المستودع أو في `node_modules/next/dist/docs/` عند تعديل APIs أو هيكل الملفات.
