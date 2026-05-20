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
          <Navbar />
          <main className="flex-1 pt-16">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-white/5 bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-500">
                  © 2026 VT BEYOND FRAME — ระบบค้นหารูปจากใบหน้า
                </p>
                <p className="text-xs text-slate-600">
                  Powered by AI Face Recognition
                </p>
              </div>
            </div>
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
