import Link from "next/link";

export function ImportantLinks() {
  return (
    <section
      className="mx-auto max-w-6xl px-4 py-14"
      aria-labelledby="links-heading"
    >
      <h2
        id="links-heading"
        className="font-heading text-2xl font-bold text-gov-navy sm:text-3xl"
      >
        روابط مهمة
      </h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <a
          href="/documents/health-guide.pdf"
          className="flex min-h-14 items-center justify-center rounded-md border border-gov-navy bg-gov-navy px-6 py-4 text-center text-base font-semibold text-white transition-colors hover:bg-gov-navy-deep"
          download
        >
          تحميل الدليل الصحي (PDF)
        </a>
        <Link
          href="/hajj-umrah#instructions"
          className="flex min-h-14 items-center justify-center rounded-md border-2 border-gov-navy bg-white px-6 py-4 text-center text-base font-semibold text-gov-navy transition-colors hover:bg-gov-gray-50"
        >
          تعليمات الحج والعمرة
        </Link>
      </div>
    </section>
  );
}
