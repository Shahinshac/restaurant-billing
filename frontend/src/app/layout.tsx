import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import AppLayout from "@/components/AppLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: "RestoPro Cloud — High Performance Restaurant Management",
  description: "Enterprise-grade POS, Kitchen (KDS), and Analytics suite for modern restaurant operations.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RestoPro Console",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className="antialiased bg-[var(--background)] text-[var(--text-main)] font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <AppLayout>{children}</AppLayout>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#0f172a",
              color: "#fff",
              borderRadius: "16px",
              padding: "16px 24px",
              fontSize: "13px",
              fontWeight: "600",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            },
            success: { 
              iconTheme: { primary: "#10b981", secondary: "#fff" },
            },
            error: { 
              iconTheme: { primary: "#f43f5e", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
