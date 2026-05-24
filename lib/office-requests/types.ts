export type OfficeRequestType = "booking" | "complaint" | "proposal";
export type TravelerCategory = "international" | "hajj_umrah" | "citizen";

export type OfficeRequestStatus =
  | "new"
  | "in_progress"
  | "contacted"
  | "completed"
  | "cancelled";

export type AdminRole =
  | "super_admin"
  | "governorate_admin"
  | "office_admin"
  | "office_user"
  | "office_reception";

export type Governorate = {
  id: string;
  labelAr: string;
  sortOrder: number;
  active: boolean;
};

export type TravelerState = {
  id: string;
  labelAr: string;
  sortOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type OfficeWorkingHours = {
  twentyFourSeven?: boolean;
  /** "08:00" / "17:00" — 24-hour local time */
  from?: string;
  to?: string;
  /** Arabic «except» line; omit = charter default per locale */
  exceptAr?: string;
};

export type Office = {
  id: string;
  governorateId: string;
  /** ترتيب العرض في جداول المكاتب العامة (عمود «م»). */
  serialInGovernorate: number;
  administrationAr: string;
  nameAr: string;
  addressAr: string;
  phone: string | null;
  mapsUrl: string;
  service: "hajj_umrah_travelers" | "hajj_umrah_only";
  active: boolean;
  /**
   * حالات المسافرين التي يخدمها المكتب.
   * غير مُعرَّف أو فارغ = اشتقاق تلقائي من `service` (توافق مع المكاتب القديمة).
   */
  travelerStateIds?: string[];
  /** Max booking requests per calendar day for this office; omit or null = unlimited. */
  dailyBookingCap?: number | null;
  workingHours?: OfficeWorkingHours;
  createdAt?: string;
  updatedAt?: string;
};

/** Persisted under Firestore `settings/app`. */
export type AppBookingSettings = {
  bookingSameDayCutoffHour: number;
};

export const DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR = 14;

export type OfficeRequest = {
  id: string;
  requestNumber: string;
  requestSequence?: number;
  governorateId?: string;
  officeId: string;
  officeNameAr: string;
  type: OfficeRequestType;
  /** حالة مسافر من `traveler_states` (الحجوزات الجديدة). */
  travelerStateId?: string;
  /** طلبات قديمة قبل إدخال حالات المسافرين الديناميكية. */
  travelerCategory?: TravelerCategory;
  preferredDate?: string;
  status: OfficeRequestStatus;
  name: string;
  phone: string;
  details: string;
  notes: string;
  /** true عند اختيار «ذوي همم» في نموذج الحجز */
  hasSpecialNeeds?: boolean;
  /** true عند اختيار «كبار السن» في نموذج الحجز */
  hasElderly?: boolean;
  /** Secret segment for the public booking pass URL; absent on legacy documents. */
  passToken?: string;
  /** Public pass links expire after the configured token TTL. */
  passTokenExpiresAt?: string;
  lastWhatsappAt?: string;
  /** Hash id in `booking_duplicates` for atomic duplicate prevention. */
  duplicateKey?: string;
  createdAt: string;
  updatedAt: string;
};

/** Read-only payload for `/booking/pass/[id]?t=…` after token verification. */
export type BookingPassPublic = {
  id: string;
  requestNumber: string;
  governorateId?: string;
  officeId: string;
  officeNameAr: string;
  type: OfficeRequestType;
  travelerStateId?: string;
  travelerCategory?: TravelerCategory;
  preferredDate?: string;
  status: OfficeRequestStatus;
  name: string;
  details: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatedOfficeRequestPublic = PublicOfficeRequestStatus & {
  passToken: string;
};

export type PublicOfficeRequestStatus = Pick<
  OfficeRequest,
  | "id"
  | "requestNumber"
  | "governorateId"
  | "officeId"
  | "officeNameAr"
  | "type"
  | "travelerStateId"
  | "travelerCategory"
  | "preferredDate"
  | "status"
  | "notes"
  | "createdAt"
  | "updatedAt"
> & {
  /** Present after phone-verified status lookup or on the device after booking. */
  passToken?: string;
};

export type AdminUserProfile = {
  uid: string;
  email: string | null;
  displayName: string;
  role: AdminRole;
  governorateId?: string | null;
  officeId: string | null;
  allowedOfficeIds?: string[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type MessageTemplate = {
  id: string;
  title: string;
  body: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/** جمهور اللقاح في الكتالوج (يتطابق مع `UserCategory` في `data/vaccines.ts`). */
export type VaccineUserCategory =
  | "international"
  | "hajj"
  | "umrah"
  | "citizen";

export type VaccineCatalogEntry = {
  id: string;
  category: VaccineUserCategory;
  nameAr: string;
  nameEn: string;
  nameFr?: string;
  priceEgp: number | null;
  free: boolean;
  sortOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/** دولة وجهة ومتطلبات التطعيم (مجموعة `destination_countries`). */
export type DestinationCountry = {
  id: string;
  nameEn: string;
  nameAr: string;
  requirementsAr: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type DestinationCountryImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

export type AdminSession = {
  uid: string;
  email: string | null;
  profile: AdminUserProfile;
};

/** منفّذ إجراء مسجّل في سجل النشاط (يُمرَّر من الإجراءات على الخادم). */
export type AdminActivityActor = {
  uid: string;
  label: string;
};

export type AdminActivityLogAction =
  | "request.updated"
  | "request.whatsapp_marked"
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "settings.booking_updated"
  | "office.created"
  | "office.updated"
  | "office.active_changed"
  | "vaccine.upserted"
  | "vaccine.active_changed"
  | "traveler_state.upserted"
  | "traveler_state.active_changed"
  | "destination_countries.imported"
  | "offices.imported"
  | "vaccines.imported"
  | "templates.imported"
  | "template.created"
  | "template.updated"
  | "template.deleted";

export type AdminActivityLogEntry = {
  id: string;
  createdAt: string;
  actorUid: string;
  actorLabel: string;
  action: AdminActivityLogAction;
  summaryAr: string;
  officeId: string | null;
  requestId?: string;
  meta?: Record<string, unknown>;
};

export type PaginatedResult<T> = {
  items: T[];
  nextCursor: string | null;
};

export type RetentionRunResult = {
  archivedRequests: number;
  archivedActivityLogs: number;
  archivedPublicEvents: number;
  deletedArchivedRequests: number;
  deletedArchivedActivityLogs: number;
  deletedArchivedPublicEvents: number;
  deletedStalePublicSessions: number;
  truncated: boolean;
  maxDocs: number;
};

export const REQUEST_TYPE_LABELS: Record<OfficeRequestType, string> = {
  booking: "حجز موعد",
  complaint: "شكوى",
  proposal: "مقترح",
};

export const TRAVELER_CATEGORY_LABELS: Record<TravelerCategory, string> = {
  international: "مسافر دولي",
  hajj_umrah: "مسافر حج وعمرة",
  citizen: "مواطنين",
};

export const REQUEST_STATUS_LABELS: Record<OfficeRequestStatus, string> = {
  new: "جديد",
  in_progress: "قيد المتابعة",
  contacted: "تم التواصل",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export const DEFAULT_MESSAGE_TEMPLATE =
  "مرحباً أستاذ/ة {name}\n\nنتواصل مع حضرتك بخصوص طلبك لدى {officeName}.\n\nالعنوان: {officeAddress}\nالموقع على الخريطة: {officeMapUrl}\n\nلمتابعة حالة الطلب في أي وقت، احفظ الرابط التالي أو افتحه من هذه الرسالة (لا يشترط حفظ رقمنا في جهات الاتصال):\n{bookingPassUrl}\n\nحالة المسافر: {travelerStateAr}\n\nمع تحيات {officeName}";
