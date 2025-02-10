"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "../contexts/AuthContext";

interface Paper {
  id: string;
  title: string;
  isScored?: boolean;
  poster_number: string;
}

export default function ResearchPaperList() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const { user } = useAuth();
  console.log(user);
  useEffect(() => {
    const fetchPapersAndScores = async () => {
      try {
        // Fetch papers
        const papersResponse = await fetch("/api/papers");
        const papersData = await papersResponse.json();

        // Filter papers based on user's posters array
        const userAssignedPapers = papersData.papers.filter((paper: Paper) =>
          user?.posters?.includes(paper.poster_number)
        );

        console.log("userAssignedPapers", userAssignedPapers);

        setPapers(userAssignedPapers);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (user) {
      fetchPapersAndScores();
    }
  }, [user]);

  return (
    <ul className='space-y-4'>
      {papers.map((paper) => (
        <li key={paper.id}>
          <Card className='bg-gray-800 bg-opacity-80 shadow-lg backdrop-blur-sm'>
            <CardHeader>
              <small className='text-gray-400'>Title</small>
              <CardTitle className='text-xl font-semibold text-white'>
                {paper.title}
              </CardTitle>
            </CardHeader>
            <CardFooter className='w-full'>
              <Link
                href={`/update-score/${paper.id}`}
                passHref
                className='w-full'
              >
                <Button
                  variant='secondary'
                  className='w-full py-6 text-lg font-semibold transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white'
                >
                  {paper.isScored ? "Update Score" : "Score this paper"}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </li>
      ))}
    </ul>
  );
}
