import type { Metadata, Viewport } from "next";
import { Inter, Amiri } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Arabic serif for calligraphy accents (Bismillah, etc.).
const amiri = Amiri({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dawah Department — ASSDI Management System",
  description:
    "Course progress, member activity and reporting for the Dawah Department of As-Sunnah Skill Development Institute (ASSDI).",
  applicationName: "ADIMS",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "ADIMS",
    // `default` keeps the iOS status bar readable over the white app header;
    // black-translucent would put white glyphs on it.
    statusBarStyle: "default",
  },
  // Stops iOS from turning stray digits (batch numbers, dates) into call links.
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom stays available on purpose — capping it is an accessibility
  // regression, and the 16px input rule in globals.css already stops iOS from
  // auto-zooming on focus.
  maximumScale: 5,
  // Draw under the notch/home indicator; the shell pays it back with
  // env(safe-area-inset-*) padding.
  viewportFit: "cover",
  // Keep the layout still when the on-screen keyboard opens.
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b5d3a" },
    { media: "(prefers-color-scheme: dark)", color: "#042417" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      className={`${inter.variable} ${amiri.variable} h-full antialiased`}
    >
      {/*
        `PwaProvider` is deliberately NOT mounted here. The installed app is
        the staff portal only, so the service worker and the install banner are
        mounted on /login and inside the (app) group instead — a visitor
        browsing the public marketing site is never asked to install an
        internal tool.
      */}
      <body className="min-h-full">{children}</body>
    </html>
  );
}
