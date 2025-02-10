"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { user, login } = useAuth();

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      router.push(user.role === "organizer" ? "/dashboard" : "/judge");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code) {
      const success = await login(code);
      if (success) {
        router.push("/judge");
      } else {
        setError("Invalid code");
      }
    } else {
      setError("Please enter your code");
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <Card className='w-full max-w-md bg-gray-800 bg-opacity-80 text-white'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold text-center'>
            Judge Login
          </CardTitle>
          <CardDescription className='text-center text-gray-400'>
            Enter your unique code to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='code' className='text-white'>
                Code
              </Label>
              <Input
                id='code'
                type='text'
                placeholder='Enter your 5-character code'
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={5}
                required
                className='bg-gray-700 text-white border-gray-600 focus:border-blue-500'
              />
            </div>
            {error && <p className='text-red-500 text-sm'>{error}</p>}
            <Button
              type='submit'
              className='w-full bg-blue-600 hover:bg-blue-700'
            >
              Log In
            </Button>
          </form>
        </CardContent>
        <CardFooter className='flex justify-center'>
          <Link
            href='/organizer-login'
            className='text-sm text-blue-400 hover:underline'
          >
            Organizer Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
