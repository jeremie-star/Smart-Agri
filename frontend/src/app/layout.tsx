import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Smart Irrigation Assistant",
  description: "AI-powered irrigation management for East African farmers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head className="">
        <link rel="icon" href="/logo.png" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        {/* top header with logo */}
        <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="Smart Irrigation Assistant"
                className="h-8 w-auto"
              />
              <span className="hidden sm:inline text-lg font-bold text-gray-900 dark:text-white">
                Smart Irrigation Assistant
              </span>
            </Link>
          </div>
        </header>

        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
