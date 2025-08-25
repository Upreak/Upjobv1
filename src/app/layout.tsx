import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/providers/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job Board with AI Co-Pilot",
  description: "AI-powered job board platform with intelligent candidate matching and recruiter co-pilot",
  keywords: ["Job Board", "AI Co-Pilot", "Recruitment", "Jobs", "Candidates", "AI"],
  authors: [{ name: "Job Board Team" }],
  openGraph: {
    title: "Job Board with AI Co-Pilot",
    description: "AI-powered job board platform with intelligent candidate matching",
    url: "https://jobboard.example.com",
    siteName: "Job Board AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Job Board with AI Co-Pilot",
    description: "AI-powered job board platform with intelligent candidate matching",
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
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
