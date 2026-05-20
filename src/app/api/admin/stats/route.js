import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/admin/stats — Get dashboard statistics
export async function GET() {
  try {
    const { count, error } = await supabaseAdmin
      .from('face_embeddings')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return NextResponse.json({
      totalFaces: count || 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลสถิติได้' },
      { status: 500 }
    );
  }
}
