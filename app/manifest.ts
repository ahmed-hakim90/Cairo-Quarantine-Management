import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "إدارة الحجر الصحي بالقاهرة",
    short_name: "الحجر الصحي",
    description:
      "البوابة الرسمية لخدمات الحجر الصحي والتطعيمات للمسافرين والمواطنين بمحافظة القاهرة.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c2340",
    theme_color: "#0c2340",
    lang: "ar",
    dir: "rtl",
    categories: ["health", "government", "travel"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-256.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "حجز موعد تطعيم / شكوى",
        short_name: "حجز / شكوى",
        url: "/ar/booking",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "تقديم شكوى أو مقترح",
        short_name: "شكوى ومقترح",
        url: "/ar/complaint",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "ميثاق المتعاملين",
        short_name: "الميثاق",
        url: "/ar/charter",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
