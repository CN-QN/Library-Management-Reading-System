import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import AuthInit from "@/components/auth/AuthInit";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "LibraryHub - Reader Portal",
  description: "Hệ thống đọc sách trực tuyến dành cho sinh viên",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} font-sans h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthInit>
          {children}
        </AuthInit>
      </body>
    </html>
  );
}
