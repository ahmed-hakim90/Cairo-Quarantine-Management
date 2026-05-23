"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/landing/ui/GlassCard";
import { OfficeDetailDialog } from "@/components/landing/ui/OfficeDetailDialog";
import { SectionHeading } from "@/components/landing/ui/SectionHeading";
import type { Office } from "@/lib/office-requests/types";
import type { LandingMessages } from "@/lib/i18n/landing-messages";
import type { Locale } from "@/lib/i18n/config";

type LandingOfficesProps = {
  offices: Office[];
  locale: Locale;
  copy: LandingMessages["offices"];
};

function serviceLabel(
  office: Office,
  copy: LandingMessages["offices"],
): string {
  return office.service === "hajj_umrah_travelers"
    ? copy.serviceTravelers
    : copy.serviceUmrahOnly;
}

export function LandingOffices({ offices, locale, copy }: LandingOfficesProps) {
  const [selected, setSelected] = useState<Office | null>(null);
  const reduceMotion = useReducedMotion();
  const display = offices.slice(0, 12);

  return (
    <section
      id="offices"
      className="scroll-mt-20 bg-landing-primary/[0.04] px-4 py-16 sm:py-20"
      aria-labelledby="landing-offices-heading"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="landing-offices-heading"
          heading={copy.heading}
          intro={copy.intro}
          className="mb-10"
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {display.map((office, index) => (
            <li key={office.id}>
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 6) * 0.05 }}
              >
                <GlassCard as="article" className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading text-base font-bold text-landing-primary">
                      {office.nameAr}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        office.active
                          ? "bg-landing-success/15 text-landing-success"
                          : "bg-gov-gray-200 text-gov-gray-600"
                      }`}
                    >
                      {office.active ? copy.statusActive : copy.statusInactive}
                    </span>
                  </div>
                  <dl className="mt-4 flex flex-1 flex-col gap-2 text-sm">
                    <div>
                      <dt className="font-semibold text-landing-primary/80">
                        {copy.colLocation}
                      </dt>
                      <dd className="mt-0.5 text-landing-primary/70 line-clamp-2">
                        {office.addressAr}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-landing-primary/80">
                        {copy.colServices}
                      </dt>
                      <dd className="mt-0.5 text-landing-primary/70">
                        {serviceLabel(office, copy)}
                      </dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => setSelected(office)}
                    className="mt-4 w-full rounded-xl border border-landing-secondary/30 py-2.5 text-sm font-semibold text-landing-primary transition-colors hover:bg-landing-secondary/10"
                  >
                    {copy.viewDetails}
                  </button>
                </GlassCard>
              </motion.div>
            </li>
          ))}
        </ul>
      </div>

      <OfficeDetailDialog
        office={selected}
        locale={locale}
        copy={copy.dialog}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
