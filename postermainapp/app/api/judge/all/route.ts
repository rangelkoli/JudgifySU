import { supabase } from "@/utils/supabase"
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { data: judges, error } = await supabase
            .from('users')
            .select('id, first_name, last_name, code, posters')
            .eq('role', 'judge');

        if (error) throw error;

        if (!judges || judges.length === 0) {
            return NextResponse.json(
                { error: "No judges found" },
                { status: 404 }
            );
        }

        return NextResponse.json(judges, { status: 200 });
    } catch (error) {
        console.error("Error fetching judges:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
