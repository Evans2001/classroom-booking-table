import type { Metadata, Viewport } from "next";

import { ToastProvider } from "@/components/common/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Room Booking Lecturer",
    template: "%s | Room Booking Lecturer",
  },
  description: "Lecturer mobile app for room booking and issue reporting.",
  applicationName: "Room Booking Lecturer",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Room Booking",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/faculty-logo.svg",
    apple: "/faculty-logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#5c2c30",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
