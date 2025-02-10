import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { supabase } from "@/utils/supabase"

type Props = {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  req: NextRequest,
  props: Props
) {

  const { id } = await props.params
  const { data: paper, error } = await supabase
    .from("papers")
    .select("title")
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ paper })
}
