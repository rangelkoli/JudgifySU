import { NextResponse } from "next/server"
import { supabase } from "@/utils/supabase"

export async function POST(request: Request) {
  const { user } = await request.json()

  if (!user || !user.id) {
    return NextResponse.json({ error: "Invalid user data" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Invalid user" }, { status: 401 })
  }

  return NextResponse.json({ valid: true })
}
