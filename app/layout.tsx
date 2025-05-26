import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "../lib/authContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taka Clinic Management",
  description: "Modern clinic management system for doctors and administrators",
};

// Primary font for UI elements
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Secondary font for headings
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} antialiased min-h-full`}
      >
        <div className="app-container min-h-screen flex flex-col">
          <AuthProvider>
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
