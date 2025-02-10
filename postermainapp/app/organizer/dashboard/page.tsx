"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import OrganizerNav from "../../components/OrganizerNav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface Score {
  id: string;
  score: number;
  notes: string;
  created_at: string;
  papers: { title: string };
  users: {
    first_name: string;
    last_name: string;
  };
}

export default function OrganizerDashboard() {
  const [showLogs, setShowLogs] = useState(true);
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    const fetchScores = async () => {
      const response = await fetch("/api/scores");
      const data = await response.json();
      setScores(data.scores);
    };

    fetchScores();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["organizer"]}>
      <div className='container mx-auto px-4 py-8'>
        <OrganizerNav />
        <div className='mb-4'>
          <Button
            onClick={() => setShowLogs(true)}
            variant={showLogs ? "default" : "outline"}
            className='mr-2'
          >
            Judge Logs
          </Button>
        </div>
        <Card className='bg-gray-800 text-white'>
          <CardHeader>
            <CardTitle>Judge Update Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judge</TableHead>
                  <TableHead>Paper</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map((score) => (
                  <TableRow key={score.id}>
                    <TableCell>
                      {score.users.first_name} {score.users.last_name}
                    </TableCell>
                    <TableCell>{score.papers.title}</TableCell>
                    <TableCell>{score.score}</TableCell>
                    <TableCell>{score.notes}</TableCell>
                    <TableCell>
                      {new Date(score.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
