import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

import { cookies } from 'next/headers';

// DELETE /api/photos/[id] — Delete a specific photo
export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'รหัสรูปภาพไม่ถูกต้อง' }, { status: 400 });
    }

    // First get the photo to know the event_id and storage path
    const { data: photo, error: fetchError } = await supabaseAdmin
      .from('photos')
      .select('event_id, storage_path')
      .eq('id', id)
      .single();
      
    if (fetchError || !photo) {
      return NextResponse.json({ error: 'ไม่พบรูปภาพ' }, { status: 404 });
    }

    // Delete from database (this will cascade to face_embeddings)
    const { error } = await supabaseAdmin
      .from('photos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Attempt to delete from storage if possible
    if (photo.storage_path) {
      await supabaseAdmin.storage
        .from('event-photos')
        .remove([photo.storage_path]);
    }

    // Update event photo count
    const { count } = await supabaseAdmin
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', photo.event_id);

    await supabaseAdmin
      .from('events')
      .update({ photo_count: count || 0 })
      .eq('id', photo.event_id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถลบรูปภาพได้' },
      { status: 500 }
    );
  }
}
