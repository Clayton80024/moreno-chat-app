import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import { ClerkProvider } from '@clerk/nextjs';
import { SimpleThemeProvider } from '@/components/SimpleThemeProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Moreno Chat - Connect with Friends",
  description: "A modern chat application to connect with friends and share experiences",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} antialiased bg-gray-50 dark:bg-gray-900`}>
          <SimpleThemeProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </SimpleThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
