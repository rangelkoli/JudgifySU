import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function OrganizerNav() {
  const { logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleExportScores = async () => {
    try {
      const response = await fetch("/api/export-scores");
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "poster_scores.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting scores:", error);
      alert("Failed to export scores");
    }
  };

  return (
    <nav className='w-full px-4 py-4 shadow-lg'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl md:text-4xl font-bold text-white'>
            Organizer Portal
          </h1>

          {/* Mobile menu button */}
          <button
            className='md:hidden text-white'
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop menu */}
          <div className='hidden md:flex space-x-2 lg:space-x-4'>
            <Link href='/organizer'>
              <Button
                variant='outline'
                className='bg-gray-800 text-white hover:bg-gray-700 transition-colors'
                size='sm'
              >
                Home
              </Button>
            </Link>

            <Link href='/organizer/all-judges'>
              <Button
                variant='outline'
                className='bg-gray-800 text-white hover:bg-gray-700 transition-colors'
                size='sm'
              >
                All Judges
              </Button>
            </Link>

            <Link href='/organizer/allot-judges'>
              <Button
                variant='outline'
                className='bg-blue-600 text-white hover:bg-blue-700 transition-colors'
                size='sm'
              >
                Allot Judges
              </Button>
            </Link>
            <Button
              variant='outline'
              className='bg-purple-600 text-white hover:bg-purple-700 transition-colors'
              onClick={handleExportScores}
              size='sm'
            >
              Export Scores
            </Button>
            <Link href='/organizer/upload-final-res'>
              <Button
                variant='outline'
                className='bg-green-600 text-white hover:bg-green-700 transition-colors'
                size='sm'
              >
                Results
              </Button>
            </Link>
            <Button
              variant='outline'
              className='bg-gray-800 text-white hover:bg-gray-700 transition-colors'
              onClick={handleLogout}
              size='sm'
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`${
            isMenuOpen ? "flex" : "hidden"
          } md:hidden flex-col space-y-2 pt-4 pb-2`}
        >
          <Link href='/organizer'>
            <Button
              variant='outline'
              className='w-full bg-gray-800 text-white hover:bg-gray-700 transition-colors'
              size='sm'
            >
              Home
            </Button>
          </Link>
          <Link href='/organizer/upload'>
            <Button
              variant='outline'
              className='w-full bg-blue-600 text-white hover:bg-blue-700 transition-colors'
              size='sm'
            >
              Upload Excel
            </Button>
          </Link>
          <Link href='/organizer/all-judges'>
            <Button
              variant='outline'
              className='w-full bg-gray-800 text-white hover:bg-gray-700 transition-colors'
              size='sm'
            >
              All Judges
            </Button>
          </Link>
          <Link href='/organizer/allot-judges'>
            <Button
              variant='outline'
              className='w-full bg-blue-600 text-white hover:bg-blue-700 transition-colors'
              size='sm'
            >
              Allot Judges
            </Button>
          </Link>
          <Button
            variant='outline'
            className='w-full bg-purple-600 text-white hover:bg-purple-700 transition-colors'
            onClick={handleExportScores}
            size='sm'
          >
            Export Scores
          </Button>
          <Link href='/organizer/upload-final-res'>
            <Button
              variant='outline'
              className='w-full bg-green-600 text-white hover:bg-green-700 transition-colors'
              size='sm'
            >
              Results
            </Button>
          </Link>
          <Button
            variant='outline'
            className='w-full bg-gray-800 text-white hover:bg-gray-700 transition-colors'
            onClick={handleLogout}
            size='sm'
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
