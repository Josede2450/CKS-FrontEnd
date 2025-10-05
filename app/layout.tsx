import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// ✅ Import logo
import cksLogo from "./public/images/cks.png";

// Fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ Metadata for SEO + Open Graph using same logo
export const metadata: Metadata = {
  title: "CKS – Creativity, Knowledge & Software",
  description:
    "CKS is a modern web development company dedicated to creating high-quality, user-focused digital solutions in software development, marketing, and design.",
  icons: {
    icon: cksLogo.src,
    shortcut: cksLogo.src,
    apple: cksLogo.src,
  },
  openGraph: {
    title: "CKS – Creativity, Knowledge & Software",
    description: "Modern web development, marketing, and design solutions.",
    url: "https://cks.software",
    siteName: "Creativity, Knowledge & Software",
    images: [
      {
        url: cksLogo.src, // 👈 same logo used for Open Graph
        width: 600, // if your logo is square, 600x600 works fine
        height: 600,
        alt: "CKS Logo – Creativity, Knowledge & Software",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CKS – Creativity, Knowledge & Software",
    description: "Modern web development, marketing, and design solutions.",
    images: [cksLogo.src],
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
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col antialiased`}
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
