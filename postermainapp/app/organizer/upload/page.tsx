"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import OrganizerNav from "../../components/OrganizerNav";
import { Button } from "@/components/ui/button";

interface UploadResult {
  firstName: string;
  lastName: string;
  code: string;
  error?: string;
}

export default function ExcelUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/upload-excel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResults(response.data.results);
    } catch (err) {
      setError("An error occurred while uploading the file. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["organizer"]}>
      <div className='container mx-auto px-4 py-8'>
        <OrganizerNav />
        <Card className='bg-gray-800 text-white'>
          <CardHeader>
            <CardTitle>Excel File Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className='border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors'
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the Excel file here...</p>
              ) : (
                <p>
                  Drag and drop an Excel file here, or click to select a file
                </p>
              )}
            </div>
            {file && (
              <div className='mt-4'>
                <p>Selected file: {file.name}</p>
                <Button
                  onClick={handleUpload}
                  disabled={isLoading}
                  className='mt-2'
                >
                  {isLoading ? "Uploading..." : "Upload File"}
                </Button>
              </div>
            )}
            {error && <p className='text-red-500 mt-4'>{error}</p>}
            {results && results.length > 0 && (
              <div className='mt-4'>
                <h2 className='text-xl font-semibold mb-2'>Upload Results:</h2>
                <table className='w-full'>
                  <thead>
                    <tr>
                      <th className='text-left'>First Name</th>
                      <th className='text-left'>Last Name</th>
                      <th className='text-left'>Code</th>
                      <th className='text-left'>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <tr key={index}>
                        <td>{result.firstName}</td>
                        <td>{result.lastName}</td>
                        <td>{result.code || "N/A"}</td>
                        <td>
                          {result.error ? "Error: " + result.error : "Success"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
