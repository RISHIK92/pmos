import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dex - The Intelligent Personal OS",
  description:
    "Turn your phone into a proactive intelligent agent. Your Life, Optimize.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-background text-primary antialiased selection:bg-primary/20`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
