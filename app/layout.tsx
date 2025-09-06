import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import { AuthProvider } from '@/contexts/AuthContext';
import { SimpleThemeProvider } from '@/components/SimpleThemeProvider';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ToastProvider } from '@/components/Toast';

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
    <html lang="en" suppressHydrationWarning>
                  <body className={`${inter.className} antialiased bg-gray-50 dark:bg-gray-900`}>
              <AuthProvider>
                <RealtimeProvider>
                  <NotificationProvider>
                    <ToastProvider>
                      <SimpleThemeProvider>
                        <LayoutWrapper>
                          {children}
                        </LayoutWrapper>
                      </SimpleThemeProvider>
                    </ToastProvider>
                  </NotificationProvider>
                </RealtimeProvider>
              </AuthProvider>
            </body>
    </html>
  );
}
