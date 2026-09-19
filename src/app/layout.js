import { IBM_Plex_Mono, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import Toast from "@/components/layout/Toast";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata = {
  title: "SmartDesk — ศูนย์ช่วยเหลือ IT",
  description: "ศูนย์ช่วยเหลือ IT ภายในองค์กร — คลังความรู้ แจ้งปัญหา และติดตามสถานะ",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="th"
      className={`${notoSansThai.variable} ${ibmPlexMono.variable} h-full`}
    >
      <body className="min-h-full bg-page text-ink">
        <AppProvider>
          {children}
          <Toast />
        </AppProvider>
      </body>
    </html>
  );
}
