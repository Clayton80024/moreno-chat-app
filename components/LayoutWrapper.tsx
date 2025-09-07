"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import SplashPage from "@/components/SplashPage";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import UserButton from "@/components/UserButton";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      {user ? (
        <div className="flex h-screen overflow-hidden relative">
          {/* Mobile sidebar */}
          <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          {/* Desktop sidebar */}
          <Sidebar />
          
          {/* Main content with mobile menu button */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile header with menu button */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
                <div className="flex items-center">
                  <button
                    type="button"
                    className="p-2 -ml-2"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Bars3Icon className="h-6 w-6 text-gray-600" aria-hidden="true" />
                  </button>
                  <div className="ml-3 flex items-center">
                    <h1 className="text-lg font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-blackt">
                      Moreno
                    </h1>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {pathname === "/chats" && "Messages"}
                      {pathname === "/friends" && "Friends"}
                      {pathname === "/profile" && "Profile"}
                      {pathname === "/settings" && "Settings"}
                      {pathname === "/" && "Chat"}
                    </span>
                  </div>
                </div>
                <UserButton user={user} />
            </div>
            
            {/* Page content */}
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
        </div>
      ) : (
        <SplashPage />
      )}
    </>
  );
}