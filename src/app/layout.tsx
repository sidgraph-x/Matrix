import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Matrix — a research lab for energy, taste and intelligence",
  description:
    "Matrix studies the full stack of personal intelligence: its own energy, its own silicon, its own link to the world, and a model that learns its user. We build it into one machine, the Matrix Node.",
  icons: { icon: "/fav.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${newsreader.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <a href="#main" className="skip">Skip to content</a>
        <Navbar />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
