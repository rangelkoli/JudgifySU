"use client";

import { useState } from "react";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import OrganizerNav from "../../components/OrganizerNav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dropzone,
  DropzoneEmptyState,
  DropzoneContent,
} from "@/components/ui/dropzone";
import type { FileRejection } from "react-dropzone";

interface Winner {
  poster_id: number;
  score: number;
  rank: number;
  title: string;
}

interface Winners {
  top_3: Winner[];
  other_posters: Winner[];
}

export default function UploadFinalResults() {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [winners, setWinners] = useState<Winners>({
    top_3: [],
    other_posters: [],
  });
  const [files, setFiles] = useState<File[]>([]);

  const handleFileUpload = async (
    acceptedFiles: File[],
    fileRejections: FileRejection[]
  ) => {
    if (fileRejections.length > 0) {
      setMessage("Please upload a valid Excel file");
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setMessage("Uploading...");
      setFiles(acceptedFiles);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "http://35.222.169.70:5000/scoring-posters/",
        {
          method: "POST",
          body: formData,
          mode: "cors",
          credentials: "include",
        }
      );
      const data = await response.json();
      setWinners(data.winners || []);
      if (!response.ok) throw new Error("Upload failed");

      setMessage("File uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className='flex flex-col items-center p-6'>
      <ProtectedRoute allowedRoles={["organizer"]}>
        <OrganizerNav />
        <div className='container p-4 max-w-6xl'>
          <Card className='shadow-lg'>
            <CardHeader>
              <CardTitle className='text-center text-2xl font-bold'>
                Upload Final Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col items-center space-y-4'>
                <div className='w-64'>
                  <Dropzone
                    accept={{
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                        [".xlsx"],
                      "application/vnd.ms-excel": [".xls"],
                    }}
                    maxFiles={1}
                    disabled={isUploading}
                    onDrop={handleFileUpload}
                    src={files}
                  >
                    <DropzoneEmptyState />
                    <DropzoneContent />
                  </Dropzone>
                </div>

                {message && (
                  <p
                    className={`text-center ${
                      message.includes("success")
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {message}
                  </p>
                )}

                {winners && (
                  <div className='winners-list p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl text-black shadow-lg w-full max-w-4xl border border-gray-200'>
                    <h3 className='text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600'>
                      Competition Results
                    </h3>

                    {/* Top 3 Winners Section */}
                    <div className='mb-8'>
                      <h4 className='font-semibold mb-4 text-lg text-blue-800'>
                        🏆 Top 3 Winners
                      </h4>
                      <div className='space-y-4'>
                        {winners.top_3?.map((winner) => (
                          <div
                            key={winner.poster_id}
                            className={`p-4 rounded-lg transition-all duration-300 hover:scale-[1.01] ${
                              winner.rank === 1
                                ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200"
                                : winner.rank === 2
                                ? "bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200"
                                : "bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200"
                            }`}
                          >
                            <div className='flex items-center gap-4'>
                              <span className='text-2xl'>
                                {winner.rank === 1
                                  ? "🥇"
                                  : winner.rank === 2
                                  ? "🥈"
                                  : "🥉"}
                              </span>
                              <div>
                                <h5 className='font-bold text-lg'>
                                  {winner.title}
                                </h5>
                                <p className='text-sm text-gray-600'>
                                  Score:{" "}
                                  <span className='font-semibold'>
                                    {winner.score}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Other Participants Section */}
                    <div>
                      <h4 className='font-semibold mb-4 text-lg text-blue-800'>
                        📋 Other Participants
                      </h4>
                      <div className='grid gap-3 sm:grid-cols-1 lg:grid-cols-2'>
                        {winners.other_posters?.map((poster) => (
                          <div
                            key={poster.poster_id}
                            className='p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow transition-shadow duration-200'
                          >
                            <div className='text-sm font-medium text-gray-500'>
                              Rank {poster.rank}
                            </div>
                            <div className='font-medium text-gray-900 line-clamp-2'>
                              {poster.title}
                            </div>
                            <div className='text-sm text-gray-500'>
                              Score: {poster.score}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    </div>
  );
}
