import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import AppLayout from "@/components/AppLayout";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ['400', '500', '600', '700', '800', '900'],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: "26:07 | Professional Restaurant Suite",
  description: "Next-generation restaurant management platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "26:07",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} scroll-smooth`}>
      <body className="antialiased font-sans">
        <ThemeProvider>
          <AppLayout>{children}</AppLayout>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                borderRadius: "14px",
                padding: "14px 20px",
                fontSize: "13px",
                fontWeight: "600",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-lg)",
              },
              success: { 
                iconTheme: { primary: "var(--accent)", secondary: "#fff" },
              },
              error: { 
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
