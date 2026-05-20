import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/photos — List photos (optionally by event)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = page * limit;

    let query = supabaseAdmin
      .from('photos')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      photos: data,
      total: count,
      page,
      hasMore: offset + limit < count,
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลรูปภาพได้' },
      { status: 500 }
    );
  }
}

// POST /api/photos — Upload photos
export async function POST(request) {
  try {
    const formData = await request.formData();
    const eventId = formData.get('event_id');
    const photographerName = formData.get('photographer_name') || '';
    const files = formData.getAll('photos');

    if (!eventId || !files.length) {
      return NextResponse.json(
        { error: 'กรุณาเลือกกิจกรรมและรูปภาพ' },
        { status: 400 }
      );
    }

    const uploadedPhotos = [];

    for (const file of files) {
      const fileName = `${eventId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${file.name.split('.').pop()}`;

      // Convert web File to Buffer for Supabase Node.js client compatibility
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('event-photos')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('event-photos')
        .getPublicUrl(fileName);

      // Save photo record
      const { data: photoData, error: dbError } = await supabaseAdmin
        .from('photos')
        .insert({
          event_id: eventId,
          storage_path: fileName,
          original_url: urlData.publicUrl,
          thumbnail_url: urlData.publicUrl, // Use same URL for now
          photographer_name: photographerName,
        })
        .select()
        .single();

      if (dbError) {
        console.error('DB error:', dbError);
        continue;
      }

      uploadedPhotos.push(photoData);
    }

    // Update event photo count
    const { count } = await supabaseAdmin
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    await supabaseAdmin
      .from('events')
      .update({ photo_count: count })
      .eq('id', eventId);

    return NextResponse.json({
      photos: uploadedPhotos,
      count: uploadedPhotos.length,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading photos:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถอัปโหลดรูปภาพได้' },
      { status: 500 }
    );
  }
}
