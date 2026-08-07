import type { Metadata } from "next";
import { Bungee, DM_Sans, Space_Mono, Caveat } from "next/font/google";
import "./globals.css";

const bungee = Bungee({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-script",
});

export const metadata: Metadata = {
  title: "Pickaboo — Strike a pose",
  description: "A fun, fast web photobooth. Snap, filter, decorate, download.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${bungee.variable} ${dmSans.variable} ${spaceMono.variable} ${caveat.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}