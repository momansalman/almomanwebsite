import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import ExitFeedbackModal from "@/components/ExitFeedbackModal";
import FloatingRateButton from "@/components/FloatingRateButton";
import CartDrawer from "@/components/CartDrawer";
import FloatingCartBar from "@/components/FloatingCartBar";
import FloatingOrderBanner from "@/components/FloatingOrderBanner";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: "Al Moman Frozen Foods - Fresh, Halal & Delicious",
  description:
    "Order premium frozen foods: Crispy Chicken Samosas, Beef Shami Kebabs, Spring Rolls, Patties, and Parathas. 100% Halal and hygienically prepared.",
  icons: {
    icon: "/brand-logo.png",
    shortcut: "/brand-logo.png",
    apple: "/brand-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100 min-h-screen selection:bg-emerald-500 selection:text-white`}>
        {children}
        <CartDrawer />
        <FloatingCartBar />
        <FloatingOrderBanner />
        <ExitFeedbackModal />
        <FloatingRateButton />
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

