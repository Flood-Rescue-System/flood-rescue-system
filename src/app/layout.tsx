import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flood Rescue System",
  description: "Emergency assistance during flood situations",
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "/favicon/favicon.svg",
        href: "/favicon/favicon.svg",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/favicon/favicon-dark.svg",
        href: "/favicon/favicon-dark.svg",
      },
    ],
    apple: [
      { url: "/favicon/favicon-128.png" },
      { url: "/favicon/favicon-256.png", sizes: "256x256" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
