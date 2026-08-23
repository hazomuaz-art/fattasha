import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://fattasha.vercel.app"),
  title: "فتّاشة — فتّش عن صورتك على الإنترنت",
  description: "أداة بحث بصري متعددة المصادر تساعدك في العثور على نسخ صورك ومصادرها.",
  openGraph: { title:"فتّاشة — أين ظهرت صورتك؟", description:"بحث بصري حقيقي متعدد المصادر", images:["/og.png"], locale:"ar_SA", type:"website" },
  twitter: { card:"summary_large_image", title:"فتّاشة — أين ظهرت صورتك؟", description:"بحث بصري حقيقي متعدد المصادر", images:["/og.png"] },
};
export const viewport: Viewport = { width:"device-width", initialScale:1 };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ar" dir="rtl"><body>{children}</body></html>}
