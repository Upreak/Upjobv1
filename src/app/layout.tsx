import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UpJob - AI-Powered Job Board Platform",
  description: "Modern job board platform with AI co-pilot for recruiters and candidates",
  keywords: ["job board", "AI recruitment", "careers", "jobs", "AI co-pilot"],
  authors: [{ name: "UpJob Team" }],
  openGraph: {
    title: "UpJob - AI-Powered Job Board",
    description: "AI-powered recruitment platform with modern features",
    url: "https://upjob.com",
    siteName: "UpJob",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UpJob - AI-Powered Job Board",
    description: "AI-powered recruitment platform with modern features",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
