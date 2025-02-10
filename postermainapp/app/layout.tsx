import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import type React from "react"; // Added import for React

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Judgify SU",
  description: "A website made for the EECS challenge ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={`${inter.className} bg-gray-900`}>
        <AuthProvider>
          <Toaster />
          <div className='min-h-screen grid-background'>{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
