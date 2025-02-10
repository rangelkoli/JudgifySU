"use client"

import { useAuth } from "../contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type React from "react" // Added import for React

type UserRole = "organizer" | "judge"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    } else if (allowedRoles && !allowedRoles.includes(user!.role)) {
      if (user!.role === "organizer") {
        router.push("/organizer")
      } else {
        router.push("/judge")
      }
    }
  }, [isAuthenticated, router, allowedRoles, user])

  if (!isAuthenticated || (allowedRoles && !allowedRoles.includes(user!.role))) {
    return null
  }

  return <>{children}</>
}

