import type { Metadata } from "next";
import "./globals.css"; // Global styles
import { AuthProvider } from "@/contexts/AuthContext";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "AksaraPlay - Petualangan Belajar Seru!",
  description:
    "AksaraPlay adalah platform game edukasi interaktif yang menggabungkan warisan budaya dengan keseruan bermain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="bg-slate-50 text-slate-900 min-h-screen"
      >
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
