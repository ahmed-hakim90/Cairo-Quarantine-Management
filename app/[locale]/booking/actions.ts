"use server";

import { createOfficeRequest } from "@/lib/office-requests/store";
import {
  TRAVELER_CATEGORY_LABELS,
  type OfficeRequestType,
  type PublicOfficeRequestStatus,
  type TravelerCategory,
} from "@/lib/office-requests/types";

export type BookingFormState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  values?: {
    officeId: string;
    type: OfficeRequestType;
    travelerCategory: TravelerCategory;
    preferredDate: string;
    name: string;
    phone: string;
    details: string;
  };
  request?: PublicOfficeRequestStatus & { phone: string };
};

const requestTypes: OfficeRequestType[] = ["booking", "complaint", "proposal"];
const travelerCategories: TravelerCategory[] = [
  "international",
  "hajj_umrah",
  "citizen",
];

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function submitOfficeRequest(
  _state: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const officeId = value(formData, "officeId");
  const type = value(formData, "type") as OfficeRequestType;
  const travelerCategory = value(
    formData,
    "travelerCategory",
  ) as TravelerCategory;
  const preferredDate = value(formData, "preferredDate");
  const name = value(formData, "name");
  const phone = value(formData, "phone");
  const details = value(formData, "details");

  const errors: Record<string, string> = {};
  const values = {
    officeId,
    type,
    travelerCategory,
    preferredDate,
    name,
    phone,
    details,
  };
  if (!officeId) errors.officeId = "اختر المكتب.";
  if (!requestTypes.includes(type)) errors.type = "اختر نوع الطلب.";
  if (type === "booking") {
    if (!travelerCategories.includes(travelerCategory)) {
      errors.travelerCategory = "اختر نوع المسافر.";
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      errors.preferredDate = "اختر التاريخ المطلوب.";
    }
  }
  if (name.length < 2) errors.name = "اكتب الاسم بشكل صحيح.";
  if (!/^[+\d\s()-]{9,20}$/.test(phone)) {
    errors.phone = "اكتب رقم هاتف صحيح.";
  }
  if (type !== "booking" && details.length < 5) {
    errors.details = "اكتب تفاصيل الطلب.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "راجع البيانات المطلوبة.",
      errors,
      values,
    };
  }

  try {
    const request = await createOfficeRequest({
      officeId,
      type,
      travelerCategory: type === "booking" ? travelerCategory : undefined,
      preferredDate: type === "booking" ? preferredDate : undefined,
      name,
      phone,
      details:
        type === "booking" && details.length === 0
          ? `نوع المسافر: ${TRAVELER_CATEGORY_LABELS[travelerCategory]}\nالتاريخ المطلوب: ${preferredDate}`
          : details,
    });
    return {
      ok: true,
      message: "تم إرسال الطلب بنجاح. سيتابع المكتب المختار معك قريباً.",
      request: {
        ...request,
        phone,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر حفظ الطلب حالياً، حاول مرة أخرى.",
    };
  }
}
