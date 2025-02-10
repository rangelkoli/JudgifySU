import { NextResponse } from 'next/server';
import { supabase } from "@/utils/supabase";
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    console.log(XLSX.utils.sheet_to_json(worksheet, { header: 1 }));
    // Upload to Supabase Storage
    const fileBuffer = Buffer.from(buffer);
    const fileName = `final_results_${Date.now()}.xlsx`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('results')
      .upload(fileName, fileBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        cacheControl: '3600'
      });

    if (uploadError) throw uploadError;

    return NextResponse.json({ 
      success: true, 
      message: 'File uploaded successfully',
      filePath: uploadData?.path 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
