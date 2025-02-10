import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import type React from "react"; // Added import for React

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Research Papers List",
  description: "A list of research papers with updatable scores",
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
