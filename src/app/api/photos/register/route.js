import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// POST /api/photos/register — Save photo metadata (file already uploaded to Storage by client)
export async function POST(request) {
  try {
    const body = await request.json();
    const { event_id, storage_path, original_url, photographer_name } = body;

    if (!event_id || !storage_path || !original_url) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน (event_id, storage_path, original_url)' },
        { status: 400 }
      );
    }

    // Save photo record
    const { data: photoData, error: dbError } = await supabaseAdmin
      .from('photos')
      .insert({
        event_id,
        storage_path,
        original_url,
        thumbnail_url: original_url,
        photographer_name: photographer_name || '',
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB error:', dbError);
      return NextResponse.json(
        { error: 'ไม่สามารถบันทึกข้อมูลรูปภาพได้: ' + dbError.message },
        { status: 500 }
      );
    }

    // Update event photo count
    const { count } = await supabaseAdmin
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event_id);

    await supabaseAdmin
      .from('events')
      .update({ photo_count: count })
      .eq('id', event_id);

    return NextResponse.json({ photo: photoData }, { status: 201 });
  } catch (error) {
    console.error('Error registering photo:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถบันทึกข้อมูลรูปภาพได้: ' + error.message },
      { status: 500 }
    );
  }
}
