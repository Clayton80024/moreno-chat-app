"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Only redirect if user is signed in and auth has loaded
    if (!loading && user) {
      router.push("/chats");
    }
  }, [router, user, loading]);

  // Show loading state while determining auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-pulse">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
              Moreno Chat
            </h1>
            <p className="text-gray-600 mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is signed in, show loading while redirecting
  if (user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-pulse">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
              Moreno Chat
            </h1>
            <p className="text-gray-600 mt-2">Redirecting to chats...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is not signed in, don't render anything here - let LayoutWrapper show the splash page
  return null;
}
