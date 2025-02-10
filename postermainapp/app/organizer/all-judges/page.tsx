"use client";
import React, { useEffect, useState } from "react";
import OrganizerNav from "@/app/components/OrganizerNav";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Judge {
  id: string;
  first_name: string;
  last_name: string;
  code: string;
  posters: number[];
}

export default function AllJudges() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJudges = async () => {
      try {
        const response = await axios.get("/api/judge/all");
        setJudges(response.data);
      } catch (error) {
        console.error("Error fetching judges:", error);
        toast.error("Failed to fetch judges");
      } finally {
        setIsLoading(false);
      }
    };
    fetchJudges();
  }, []);

  const handleSendEmail = async (code: string) => {
    try {
      await axios.post("/api/email/send", {
        to: "rangelkoli@gmail.com",
        subject: "Judging Invitation",
        text: "You have been invited to judge the poster presentation.",
        code: code,
      });
      console.log("Email sent successfully");
      toast.success("Email sent successfully");
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email");
    }
  };

  const handleSendToAll = async () => {
    try {
      let success = 0;
      let failed = 0;

      for (const judge of judges) {
        try {
          await axios.post("/api/email/send", {
            to: "rangelkoli@gmail.com",
            subject: "Judging Invitation",
            text: "You have been invited to judge the poster presentation.",
            code: judge.code,
          });
          success++;
        } catch (error) {
          console.error(
            `Failed to send email to judge with code ${judge.code}:`,
            error
          );
          failed++;
        }
      }

      if (failed === 0) {
        toast.success(`Successfully sent emails to all ${success} judges`);
      } else {
        toast.error(`Sent ${success} emails, failed to send ${failed} emails`);
      }
    } catch (error) {
      console.error("Error in send to all:", error);
      toast.error("Failed to send emails to all judges");
    }
  };

  return (
    <div className='min-h-screen bg-gray-900'>
      <OrganizerNav />
      <div className='p-8 max-w-7xl mx-auto'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold text-white'>All Judges</h1>
          <Button
            onClick={handleSendToAll}
            variant='outline'
            className='bg-green-600 hover:bg-green-700 text-white'
            disabled={isLoading || judges.length === 0}
          >
            Send to All Judges
          </Button>
        </div>
        {isLoading ? (
          <div className='flex justify-center items-center h-64'>
            <Loader2 className='h-8 w-8 animate-spin text-white' />
          </div>
        ) : judges.length === 0 ? (
          <p className='text-center text-gray-400'>No judges found</p>
        ) : (
          <div className='bg-gray-800 rounded-lg overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow className='border-gray-700'>
                  <TableHead className='text-gray-200'>Name</TableHead>
                  <TableHead className='text-gray-200'>Judge Code</TableHead>
                  <TableHead className='text-gray-200'>
                    Assigned Posters
                  </TableHead>
                  <TableHead className='text-gray-200'>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {judges.map((judge) => (
                  <TableRow key={judge.id} className='border-gray-700'>
                    <TableCell className='text-gray-300'>
                      {`${judge.first_name} ${judge.last_name}`}
                    </TableCell>
                    <TableCell className='text-gray-300'>
                      {judge.code}
                    </TableCell>
                    <TableCell className='text-gray-300'>
                      {judge.posters.length}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleSendEmail(judge.code)}
                        variant='outline'
                        className='bg-blue-600 hover:bg-blue-700 text-white'
                      >
                        Send Code
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
