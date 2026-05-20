import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/events — List all events
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = page * limit;

    const { data, error, count } = await supabaseAdmin
      .from('events')
      .select('*', { count: 'exact' })
      .order('event_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      events: data,
      total: count,
      page,
      hasMore: offset + limit < count,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลกิจกรรมได้' },
      { status: 500 }
    );
  }
}

// POST /api/events — Create a new event (admin only)
export async function POST(request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const event_date = formData.get('event_date');
    const location = formData.get('location');
    const coverFile = formData.get('cover_image');

    if (!name || !event_date) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อกิจกรรมและวันที่' },
        { status: 400 }
      );
    }

    let cover_image = null;

    // Upload cover image if provided
    if (coverFile && coverFile.size > 0) {
      const fileName = `covers/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${coverFile.name.split('.').pop()}`;
      
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('event-photos')
        .upload(fileName, coverFile, {
          contentType: coverFile.type,
        });

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from('event-photos')
          .getPublicUrl(fileName);
        cover_image = urlData.publicUrl;
      } else {
        console.error('Cover upload error:', uploadError);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert({
        name,
        description,
        event_date,
        location,
        cover_image,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ event: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถสร้างกิจกรรมได้' },
      { status: 500 }
    );
  }
}
