"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";

type UserRole = "organizer" | "judge";

type User = {
  id: string;
  first_name: string;
  last_name: string;
  code?: string;
  role: UserRole;
  posters: string[]; // Add posters array
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (codeOrUsername: string, password?: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const autoLogin = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Verify the stored user data with the server
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: parsedUser }),
        });

        if (response.ok) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem("user");
        }
      }
      setIsLoading(false);
    };

    autoLogin();
  }, []);

  const login = async (codeOrUsername: string, password?: string) => {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          password
            ? { username: codeOrUsername, password }
            : { code: codeOrUsername }
        ),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const { user } = await response.json();
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
