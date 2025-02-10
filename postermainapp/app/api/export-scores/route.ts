import { NextResponse } from 'next/server';
import { supabase } from "@/utils/supabase";
import * as XLSX from 'xlsx';

export async function GET() {
    try {
        // Get all judges
        const { data: judges, error: judgesError } = await supabase
            .from("users")
            .select("*")
            .eq("role", "judge")

        if (judgesError) throw judgesError;

        // Get all posters
        const { data: posters, error: postersError } = await supabase
            .from("papers")
            .select("*")

        if (postersError) throw postersError;

        // Get all scores
        const { data: scores, error: scoresError } = await supabase
            .from("scores")
            .select(`
                *,
                judges:users(*)
            `);

        if (scoresError) throw scoresError;

        // Create matrix for Excel
        const matrix = [];
        
        // Add header row with judge numbers and names
        const headerRow = ['Poster', ...judges.map(judge => 
            `${judge.first_name} ${judge.last_name}`
        )];
        matrix.push(headerRow);

        // Fill matrix with scores
        posters.forEach(poster => {
            const row = [poster.poster_number];
            judges.forEach(judge => {
                const score = scores.find(s => 
                    s.paper_id === poster.id && 
                    s.user_id === judge.id
                );
                console.log(score);
                row.push(score ? score.score : 0);
            });
            matrix.push(row);
        });

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(matrix);
        XLSX.utils.book_append_sheet(wb, ws, 'Poster Scores');

        // Generate buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Return file response
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename=poster_scores.xlsx'
            }
        });

    } catch (error) {
        console.error('Error exporting scores:', error);
        return NextResponse.json({ error: 'Failed to export scores' }, { status: 500 });
    }
}
