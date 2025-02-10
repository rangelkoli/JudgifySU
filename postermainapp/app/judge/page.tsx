"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";
import ResearchPaperList from "../components/ResearchPaperList";

export default function JudgePage() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <ProtectedRoute allowedRoles={["judge"]}>
      <main className='container mx-auto px-4 py-8 mb-16'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-4xl font-bold text-white'>
            Judge&apos;s Scoring
          </h1>
          <Button
            variant='outline'
            className='bg-gray-800 text-white hover:bg-gray-700'
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
        <ResearchPaperList />
      </main>
    </ProtectedRoute>
  );
}
