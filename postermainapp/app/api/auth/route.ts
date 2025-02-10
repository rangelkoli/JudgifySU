import { NextResponse } from "next/server"
import { supabase } from "@/utils/supabase"

export async function POST(request: Request) {
  const { code, username, password } = await request.json()

  if (code) {
    // Judge login
    const { data, error } = await supabase
      .from("users")
      .select("id, code, role, posters")
      .eq("code", code)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Invalid code" }, { status: 401 })
    }

    return NextResponse.json({ user: data })
  } else if (username && password) {
    // Organizer login
    if (
      username !== process.env.ORGANIZER_USERNAME || 
      password !== process.env.ORGANIZER_PASSWORD
    ) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }
    return NextResponse.json({
      user: {
        id: 1,
        username: process.env.ORGANIZER_USERNAME,
        role: "organizer",
      }
    })
  } else {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

