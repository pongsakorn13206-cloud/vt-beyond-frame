import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

import { cookies } from 'next/headers';

// DELETE /api/events/[id] — Delete an event and its related photos
export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'รหัสกิจกรรมไม่ถูกต้อง' }, { status: 400 });
    }

    // Since we have ON DELETE CASCADE in the database, 
    // deleting the event will automatically delete the photos and face_embeddings records.
    // Ideally, we would also delete the files from Supabase Storage here.
    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถลบกิจกรรมได้' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] — Update an event
export async function PUT(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'รหัสกิจกรรมไม่ถูกต้อง' }, { status: 400 });
    }

    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const event_date = formData.get('event_date');
    const location = formData.get('location');
    const cover_image = formData.get('cover_image'); // File if new image

    if (!name || !event_date) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' },
        { status: 400 }
      );
    }

    let coverImageUrl = undefined;

    // Handle new cover image upload
    if (cover_image && typeof cover_image === 'object') {
      const bytes = await cover_image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `covers/${Date.now()}-${cover_image.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('event-photos')
        .upload(fileName, buffer, {
          contentType: cover_image.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('ไม่สามารถอัปโหลดรูปภาพได้');
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from('event-photos')
        .getPublicUrl(fileName);

      coverImageUrl = publicUrlData.publicUrl;
    }

    const updateData = {
      name,
      description,
      event_date,
      location,
    };

    if (coverImageUrl) {
      updateData.cover_image = coverImageUrl;
    }

    const { data, error } = await supabaseAdmin
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, event: data });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถอัปเดตกิจกรรมได้' },
      { status: 500 }
    );
  }
}
