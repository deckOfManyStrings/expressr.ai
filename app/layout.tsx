import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Expressr.ai - 12 Professional Expressions",
  description: "Generate 12 professional expressions of your face for YouTube thumbnails using AI.",
  applicationName: "Expressr",
  appleWebApp: {
    capable: true,
    title: "Expressr",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3B82F6",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased safe-top safe-bottom bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
