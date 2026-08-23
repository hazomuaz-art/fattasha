import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://athar-image-trace.huzifamuaz4.chatgpt.site"),
  title: "أثر — ابحث عن صورتك على الإنترنت",
  description: "محرك بحث عكسي متعدد المصادر للعثور على نسخ صورك وحمايتها.",
  openGraph: { title:"أثر صورتك على الإنترنت", description:"بحث عكسي حقيقي متعدد المصادر", images:["/og.png"], locale:"ar_SA", type:"website" },
  twitter: { card:"summary_large_image", title:"أثر صورتك على الإنترنت", description:"بحث عكسي حقيقي متعدد المصادر", images:["/og.png"] },
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ar" dir="rtl"><body>{children}</body></html>}
