import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/admin/analytics — Fetch search analytics data
export async function GET() {
  try {
    // Get total searches
    const { count: totalSearches } = await supabaseAdmin
      .from('search_analytics')
      .select('*', { count: 'exact', head: true });

    // Get successful searches
    const { count: successfulSearches } = await supabaseAdmin
      .from('search_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('success', true);

    // Get average match count (only for successful searches)
    const { data: avgData } = await supabaseAdmin
      .from('search_analytics')
      .select('match_count')
      .eq('success', true);

    const avgMatches = avgData && avgData.length > 0
      ? Math.round(avgData.reduce((sum, r) => sum + r.match_count, 0) / avgData.length)
      : 0;

    // Get average duration
    const { data: durationData } = await supabaseAdmin
      .from('search_analytics')
      .select('duration_ms');

    const avgDuration = durationData && durationData.length > 0
      ? Math.round(durationData.reduce((sum, r) => sum + r.duration_ms, 0) / durationData.length)
      : 0;

    // Get recent searches (last 20)
    const { data: recentSearches } = await supabaseAdmin
      .from('search_analytics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    // Calculate success rate
    const successRate = totalSearches > 0
      ? Math.round((successfulSearches / totalSearches) * 100)
      : 0;

    return NextResponse.json({
      totalSearches: totalSearches || 0,
      successfulSearches: successfulSearches || 0,
      successRate,
      avgMatches,
      avgDuration,
      recentSearches: recentSearches || [],
    });
  } catch (error) {
    console.error('[Analytics] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics: ' + error.message },
      { status: 500 }
    );
  }
}
