import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

// POST /api/faces/search — Search using InsightFace + pgvector
export async function POST(request) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!imageFile) {
      return NextResponse.json({ error: 'กรุณาอัปโหลดรูปภาพ' }, { status: 400 });
    }

    // Convert to blob/buffer for Python API
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const blob = new Blob([imageBuffer], { type: imageFile.type || 'image/jpeg' });

    // Forward image to Python InsightFace API
    const pyFormData = new FormData();
    pyFormData.append('image', blob, imageFile.name || 'selfie.jpg');

    console.log(`[Search] Sending image to Python API: ${PYTHON_API_URL}/extract`);

    const extractRes = await fetch(`${PYTHON_API_URL}/extract`, {
      method: 'POST',
      body: pyFormData,
    });

    const extractData = await extractRes.json();
    console.log('[Search] Python API response:', JSON.stringify(extractData).substring(0, 200));

    if (extractData.error) {
      // Log failed search
      await logSearchAnalytics(false, 0, Date.now() - startTime);
      return NextResponse.json({ error: extractData.error }, { status: 400 });
    }

    const embedding = extractData.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      await logSearchAnalytics(false, 0, Date.now() - startTime);
      return NextResponse.json(
        { error: 'ไม่สามารถดึง embedding ได้ — Python API ตอบกลับผิดรูปแบบ' },
        { status: 500 }
      );
    }

    console.log(`[Search] Embedding dim: ${embedding.length}, querying DB...`);

    // InsightFace (ArcFace) threshold:
    // L2 distance of 1.1 means Cosine Similarity of ~0.395.
    // This is a good balance between finding variations and rejecting strangers.
    const threshold = 1.1;
    const limit = 50;
    
    // Optional event filter
    const eventId = formData.get('eventId');
    const rpcParams = {
      query_embedding: JSON.stringify(embedding),
      match_threshold: threshold,
      match_count: limit,
    };
    if (eventId && eventId !== 'all') {
      rpcParams.filter_event_id = eventId;
    }

    const { data, error } = await supabaseAdmin.rpc('match_faces', rpcParams);

    if (error) {
      console.error('[Search] Supabase RPC error:', error);
      await logSearchAnalytics(false, 0, Date.now() - startTime);
      throw error;
    }

    const results = (data || []).map(item => {
      // Calculate Cosine Similarity from L2 distance
      // L2 = sqrt(2 - 2*cos), so cos = 1 - (L2^2 / 2)
      const cosSim = 1 - (Math.pow(item.distance, 2) / 2);
      
      return {
        ...item,
        similarity: Math.max(0, Math.min(1, cosSim)),
      };
    });

    const duration = Date.now() - startTime;
    const success = results.length > 0;

    // Log analytics (fire and forget)
    await logSearchAnalytics(success, results.length, duration);

    return NextResponse.json({
      results,
      count: results.length,
      engine: 'InsightFace ArcFace (512D)',
      duration_ms: duration,
    });
  } catch (error) {
    console.error('[Search] Error:', error);
    await logSearchAnalytics(false, 0, Date.now() - startTime);
    return NextResponse.json(
      { error: 'ไม่สามารถค้นหาได้: ' + error.message },
      { status: 500 }
    );
  }
}

async function logSearchAnalytics(success, matchCount, durationMs) {
  try {
    await supabaseAdmin.from('search_analytics').insert({
      success,
      match_count: matchCount,
      duration_ms: durationMs,
    });
  } catch (err) {
    // Don't let analytics logging break the search
    console.error('[Analytics] Failed to log:', err);
  }
}
