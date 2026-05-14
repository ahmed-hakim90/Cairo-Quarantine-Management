export type OfficeRequestType = "booking" | "complaint" | "proposal";
export type TravelerCategory = "international" | "hajj_umrah" | "citizen";

export type OfficeRequestStatus =
  | "new"
  | "in_progress"
  | "contacted"
  | "completed"
  | "cancelled";

export type AdminRole = "super_admin" | "office_user";

export type Office = {
  id: string;
  administrationAr: string;
  nameAr: string;
  addressAr: string;
  phone: string | null;
  mapsUrl: string;
  service: "hajj_umrah_travelers" | "hajj_umrah_only";
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type OfficeRequest = {
  id: string;
  officeId: string;
  officeNameAr: string;
  type: OfficeRequestType;
  travelerCategory?: TravelerCategory;
  preferredDate?: string;
  status: OfficeRequestStatus;
  name: string;
  phone: string;
  details: string;
  notes: string;
  lastWhatsappAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicOfficeRequestStatus = Pick<
  OfficeRequest,
  | "id"
  | "officeNameAr"
  | "type"
  | "travelerCategory"
  | "preferredDate"
  | "status"
  | "notes"
  | "createdAt"
  | "updatedAt"
>;

export type AdminUserProfile = {
  uid: string;
  email: string | null;
  displayName: string;
  role: AdminRole;
  officeId: string | null;
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

export type AdminSession = {
  uid: string;
  email: string | null;
  profile: AdminUserProfile;
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
  "مرحباً أستاذ/ة {name}\n\nنتواصل مع حضرتك بخصوص طلبك لدى {officeName}.\n\nالعنوان: {officeAddress}\nالموقع على الخريطة: {officeMapUrl}\n\nمع تحيات {officeName}";
