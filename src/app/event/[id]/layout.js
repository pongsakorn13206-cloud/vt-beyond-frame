import { supabaseAdmin } from '@/lib/supabase-server';

export async function generateMetadata({ params }) {
  const { id } = await params;
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vt-beyond-frame.vercel.app';

  try {
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('name, description, cover_image, event_date')
      .eq('id', id)
      .single();

    if (!event) {
      return {
        title: 'ไม่พบกิจกรรม | VT BEYOND FRAME',
      };
    }

    const title = `${event.name} | VT BEYOND FRAME`;
    const description = event.description || `ภาพถ่ายกิจกรรม ${event.name} ค้นหารูปของคุณด้วยเทคโนโลยี AI จดจำใบหน้า`;
    const imageUrl = event.cover_image || `${siteUrl}/og-image.png`;

    return {
      title: event.name,
      description: description,
      openGraph: {
        title: title,
        description: description,
        url: `${siteUrl}/event/${id}`,
        type: 'article',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: event.name,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'กิจกรรม | VT BEYOND FRAME',
    };
  }
}

export default function EventLayout({ children }) {
  return children;
}
