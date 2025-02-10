"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (user?.role === "organizer") {
          router.push("/organizer");
        } else if (user?.role === "judge") {
          router.push("/judge");
        }
      } else {
        router.push("/login");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return null; // This page will always redirect, so we don't need to render anything
}
