import { NextResponse } from "next/server"
import { supabase } from "@/utils/supabase"

export async function POST(request: Request) {
  const { paperId, userId, score, notes } = await request.json()

  // Check if the row exists
  const { data: existingData, error: existingError } = await supabase
    .from("scores")
    .select("*")
    .eq("paper_id", paperId)
    .eq("user_id", userId)
    .single()

    console.log(existingData)
    console.log(existingError)
    console.log(paperId)
    console.log(userId)
    console.log(score)
    console.log(notes)
  // if (existingError && existingError.code !== 'PGRST116') {
  //   console.error(existingError)
  //   return NextResponse.json({ error: existingError.message }, { status: 500 })
  // }

  let data, error

  if (existingData) {
    // Update the existing row
    ({ data, error } = await supabase
      .from("scores")
      .update({ score, notes })
      .eq("paper_id", paperId)
      .eq("user_id", userId))
  } else {
    // Insert a new row
    ({ data, error } = await supabase
      .from("scores")
      .insert({ paper_id: paperId, user_id: userId, score, notes }))
  }

  if (error) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

export async function GET() {
  const { data, error } = await supabase
    .from("scores")
    .select(`
      id,
      score,
      notes,
      created_at,
      papers (title),
      users (first_name, last_name)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ scores: data })
}
