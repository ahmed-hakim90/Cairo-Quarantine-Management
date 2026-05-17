"use client";

type QueueCompleteTicketFormProps = {
  locale: string;
  officeId: string;
  ticketId: string;
  completeAction: (formData: FormData) => void;
  disabled?: boolean;
  compact?: boolean;
};

export function QueueCompleteTicketForm({
  locale,
  officeId,
  ticketId,
  completeAction,
  disabled = false,
  compact = false,
}: QueueCompleteTicketFormProps) {
  return (
    <form action={completeAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="ticketId" value={ticketId} />
      <input type="hidden" name="officeId" value={officeId} />
      <button
        type="submit"
        disabled={disabled}
        className={
          compact
            ? "whitespace-nowrap rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
            : "w-full rounded-md bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
        }
      >
        {disabled ? "جاري…" : "تم الانتهاء"}
      </button>
    </form>
  );
}
