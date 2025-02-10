"use client";

import { useState, type FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { useAuth } from "../../contexts/AuthContext";
import { use } from "react";

export default function UpdateScore({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [paperTitle, setPaperTitle] = useState("");
  const router = useRouter();
  const { user } = useAuth();
  const { id } = use(params);
  useEffect(() => {
    const fetchPaperTitle = async () => {
      try {
        const response = await fetch(`/api/papers/${id}`);
        if (!response.ok) throw new Error("Failed to fetch paper");
        const data = await response.json();
        setPaperTitle(data.paper.title);
      } catch (error) {
        console.error("Error fetching paper:", error);
        setPaperTitle("Unknown Paper");
      }
    };
    fetchPaperTitle();
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedScore !== null && user) {
      try {
        const response = await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paperId: id,
            userId: user.id,
            score: selectedScore,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update score");
        }

        router.push("/");
      } catch (error) {
        console.error("Error updating score:", error);
        setError("Failed to update score. Please try again.");
      }
    } else {
      setError("Please select a score");
    }
  };

  const numberBlocks = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <ProtectedRoute>
      <div className='min-h-screen flex flex-col'>
        <h1 className='text-3xl font-bold p-4 text-center text-white'>
          Update Score for {paperTitle}
        </h1>
        <form
          onSubmit={handleSubmit}
          className='flex-grow flex flex-col justify-between items-center px-4 py-8'
        >
          <div className='w-full max-w-2xl'>
            <div className='grid grid-cols-5 gap-4 mb-8'>
              {numberBlocks.map((number) => (
                <Button
                  key={number}
                  type='button'
                  onClick={() => setSelectedScore(number)}
                  className={`h-16 text-2xl ${
                    selectedScore === number
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  {number}
                </Button>
              ))}
            </div>
            {error && <p className='text-red-400 mt-2 text-center'>{error}</p>}
            <div className='text-center text-2xl mb-4'>
              {selectedScore !== null
                ? `Selected Score: ${selectedScore}`
                : "No score selected"}
            </div>
            {/* <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Enter any notes here...'
              className='w-full h-40 bg-gray-800 bg-opacity-50 text-white border-gray-700 rounded-md resize-none mb-4'
            /> */}
            <Button
              type='submit'
              className='w-full py-6 text-xl bg-blue-600 hover:bg-blue-700 text-white'
            >
              Submit Score
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
