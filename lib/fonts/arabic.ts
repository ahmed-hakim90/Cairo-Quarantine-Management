import { Almarai, IBM_Plex_Sans_Arabic } from "next/font/google";

export const almarai = Almarai({
  subsets: ["arabic", "latin"],
  weight: ["400", "700", "800"],
  variable: "--font-almarai",
  display: "swap",
});

export const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-ibm-plex-sans-arabic",
  display: "swap",
});

export function arabicFontClassName(): string {
  return `${almarai.variable} ${ibmPlexSansArabic.variable} h-full`;
}
