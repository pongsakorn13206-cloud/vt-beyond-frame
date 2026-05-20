import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

// POST /api/faces/scan — Scan faces using InsightFace Python API
export async function POST(request) {
  try {
    const body = await request.json();
    const { photo_id, event_id, photo_url } = body;

    if (!photo_id || !event_id || !photo_url) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน (photo_id, event_id, photo_url)' },
        { status: 400 }
      );
    }

    // Download the image from Supabase Storage
    const imageRes = await fetch(photo_url);
    if (!imageRes.ok) throw new Error('Failed to download image');
    const imageBlob = await imageRes.blob();

    // Send to Python InsightFace API
    const formData = new FormData();
    formData.append('image', imageBlob, 'photo.jpg');

    const detectRes = await fetch(`${PYTHON_API_URL}/detect`, {
      method: 'POST',
      body: formData,
    });

    const detectData = await detectRes.json();

    if (!detectData.faces || detectData.faces.length === 0) {
      // Mark as scanned but no faces found
      await supabaseAdmin
        .from('photos')
        .update({ face_count: 0, is_scanned: true })
        .eq('id', photo_id);

      return NextResponse.json({ saved: 0, message: 'ไม่พบใบหน้าในรูปนี้' });
    }

    // Save embeddings to database (512D vectors from InsightFace)
    const embeddings = detectData.faces.map((face) => ({
      photo_id,
      event_id,
      embedding: JSON.stringify(face.embedding),
      box_x: face.box.x,
      box_y: face.box.y,
      box_width: face.box.width,
      box_height: face.box.height,
      confidence: face.confidence,
    }));

    const { data, error } = await supabaseAdmin
      .from('face_embeddings')
      .insert(embeddings)
      .select();

    if (error) throw error;

    // Update photo face count and scanned status
    await supabaseAdmin
      .from('photos')
      .update({
        face_count: detectData.faces.length,
        is_scanned: true,
      })
      .eq('id', photo_id);

    return NextResponse.json({
      saved: data.length,
      message: `บันทึก ${data.length} ใบหน้าสำเร็จ (InsightFace 512D)`,
    });
  } catch (error) {
    console.error('Error scanning faces:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถสแกนใบหน้าได้: ' + error.message },
      { status: 500 }
    );
  }
}
