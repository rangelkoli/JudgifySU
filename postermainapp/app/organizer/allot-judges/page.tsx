"use client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import OrganizerNav from "@/app/components/OrganizerNav";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/dropzone";

export default function AllotJudges() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const { toast } = useToast();

  const handleDrop1 = (files: File[]) => {
    if (files[0] && isValidFileType(files[0])) {
      setFile1(files[0]);
      setError(null);
    } else {
      setError("Please upload a valid Excel (.xlsx) or CSV (.csv) file");
    }
  };

  const handleDrop2 = (files: File[]) => {
    if (files[0] && isValidFileType(files[0])) {
      setFile2(files[0]);
      setError(null);
    } else {
      setError("Please upload a valid Excel (.xlsx) or CSV (.csv) file");
    }
  };

  const isValidFileType = (file: File) => {
    return (
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "text/csv"
    );
  };

  const handleSubmit = async () => {
    if (!file1 || !file2) {
      setError("Please upload both files");
      return;
    }

    setLoading(true);
    setIsProcessingComplete(false);
    try {
      const formData = new FormData();
      formData.append("file1", file1);
      formData.append("file2", file2);

      // Updated to use Flask backend URL
      const response = await fetch("http://127.0.0.1:5000/process-excel", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log(data);
      if (response.ok) {
        toast({
          title: "Success",
          description: "Files processed successfully",
          style: {
            backgroundColor: "green",
            color: "white",
          },
        });
      }
      if (!response.ok) {
        throw new Error(data.message || "Failed to process files");
      }

      setError(null);
      setIsProcessingComplete(true);
      // Handle successful response
    } catch (err: Error | unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to process files";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = async () => {
    try {
      // Add your proceed logic here
      console.log("Proceeding to next step...");
      // Example: Navigate to another page or trigger another action
      const response = await fetch(
        "http://127.0.0.1:5000//upload-to-supabase",
        {
          method: "POST",
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Success",
          description: "Added to Database successfully",
          style: {
            backgroundColor: "green",
            color: "white",
          },
        });
      }
      if (!response.ok) {
        throw new Error(data.message || "Failed to upload files");
      }

      setError(null);
      setIsProcessingComplete(true);
    } catch (err: Error | unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to proceed";
      setError(errorMessage);
    }
  };

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <OrganizerNav />

      <div className='space-y-4 max-w-2xl justify-center items-center mx-auto'>
        <div>
          <label className='block mb-2 text-2xl pt-6'>
            Upload Judges Excel or CSV File
          </label>
          <Dropzone
            maxSize={1024 * 1024 * 10} // 10MB
            minSize={1024} // 1KB
            maxFiles={1}
            accept={{
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                [".xlsx"],
              "text/csv": [".csv"],
            }}
            onDrop={handleDrop1}
            onError={(err) => setError(err.message)}
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
        </div>

        <div>
          <label className='block mb-2 text-2xl pt-6'>
            Upload Second Excel or CSV File
          </label>
          <Dropzone
            maxSize={1024 * 1024 * 10}
            minSize={1024}
            maxFiles={1}
            accept={{
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                [".xlsx"],
              "text/csv": [".csv"],
            }}
            onDrop={handleDrop2}
            onError={(err) => setError(err.message)}
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
        </div>

        {error && <p className='text-red-500'>{error}</p>}
        {isProcessingComplete ? (
          <div className='flex '>
            <button
              onClick={handleProceed}
              className='px-6 py-3 bg-green-500 text-white rounded-lg text-lg'
            >
              Add to Database
            </button>
          </div>
        ) : (
          <div className='flex '>
            <button
              onClick={handleSubmit}
              disabled={loading || !file1 || !file2}
              className='px-6 py-3 bg-blue-500 text-white rounded-lg text-lg disabled:opacity-50'
            >
              {loading ? "Processing..." : "Process Files"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
