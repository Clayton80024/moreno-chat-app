"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/chats");
  }, [router]);

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
