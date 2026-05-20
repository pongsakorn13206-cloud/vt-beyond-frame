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

    // First, get all photos for this event to delete their storage files
    const { data: photos } = await supabaseAdmin
      .from('photos')
      .select('storage_path')
      .eq('event_id', id);

    // Delete all photo files from Supabase Storage
    if (photos && photos.length > 0) {
      const storagePaths = photos
        .map(p => p.storage_path)
        .filter(Boolean);

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabaseAdmin.storage
          .from('event-photos')
          .remove(storagePaths);

        if (storageError) {
          console.error('Storage delete error:', storageError);
          // Continue anyway — we still want to delete the DB records
        }
      }
    }

    // Also delete the event cover folder if it exists
    const { data: eventData } = await supabaseAdmin
      .from('events')
      .select('cover_image')
      .eq('id', id)
      .single();

    if (eventData?.cover_image) {
      // Extract storage path from the public URL
      const coverPath = eventData.cover_image.split('/storage/v1/object/public/event-photos/')[1];
      if (coverPath) {
        await supabaseAdmin.storage
          .from('event-photos')
          .remove([decodeURIComponent(coverPath)]);
      }
    }

    // Delete the event from DB (CASCADE will delete photos + face_embeddings records)
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
