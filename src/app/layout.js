import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { LanguageProvider } from "@/context/LanguageContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vt-beyond-frame.vercel.app';

export const metadata = {
  title: {
    default: "VT BEYOND FRAME — ค้นหารูปจากใบหน้า",
    template: "%s | VT BEYOND FRAME",
  },
  description: "ระบบค้นหารูปภาพจากใบหน้าด้วย AI สำหรับงานกิจกรรมวิทยาลัย อัปโหลดเซลฟี่แล้วค้นหารูปของคุณจากทุกกิจกรรม",
  keywords: "face search, face recognition, event photos, college, AI, VT BEYOND FRAME, ค้นหารูป, ใบหน้า",
  icons: {
    icon: "/beyond-logo-circle.png",
    apple: "/beyond-logo-circle.png",
  },
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: siteUrl,
    siteName: "VT BEYOND FRAME",
    title: "VT BEYOND FRAME — ค้นหารูปจากใบหน้าด้วย AI",
    description: "อัปโหลดเซลฟี่ของคุณ แล้วระบบ AI จะค้นหารูปที่มีคุณจากภาพถ่ายกิจกรรมทั้งหมดของวิทยาลัย",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VT BEYOND FRAME — AI Face Search",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VT BEYOND FRAME — ค้นหารูปจากใบหน้าด้วย AI",
    description: "อัปโหลดเซลฟี่ของคุณ แล้วระบบ AI จะค้นหารูปที่มีคุณจากภาพถ่ายกิจกรรมทั้งหมดของวิทยาลัย",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-white font-[family-name:var(--font-inter)]">
        <LanguageProvider>
          <main className="flex-1 flex items-center justify-center min-h-screen p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">ระบบขัดข้อง</h1>
              <p className="text-slate-400 mb-6 leading-relaxed">
                กำลังดำเนินการแก้ไข ขออภัยในความไม่สะดวกครับ 🔧
              </p>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-amber-500 rounded-full animate-[pulse_2s_ease-in-out_infinite]" />
              </div>
            </div>
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}
