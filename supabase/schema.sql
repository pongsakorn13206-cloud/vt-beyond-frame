-- ============================================
-- FaceFind Database Schema
-- Supabase + pgvector
-- ============================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  event_date DATE NOT NULL,
  location TEXT,
  photo_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  original_url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  face_count INTEGER DEFAULT 0,
  is_scanned BOOLEAN DEFAULT FALSE,
  photographer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Face embeddings table (512D vectors from InsightFace ArcFace)
CREATE TABLE IF NOT EXISTS face_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  embedding VECTOR(512) NOT NULL,
  box_x FLOAT,
  box_y FLOAT,
  box_width FLOAT,
  box_height FLOAT,
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS photos_event_id_idx ON photos(event_id);
CREATE INDEX IF NOT EXISTS face_embeddings_photo_id_idx ON face_embeddings(photo_id);
CREATE INDEX IF NOT EXISTS face_embeddings_event_id_idx ON face_embeddings(event_id);

-- HNSW index for fast L2 distance search (matches <-> operator in match_faces)
CREATE INDEX IF NOT EXISTS face_embeddings_vector_idx
  ON face_embeddings
  USING hnsw (embedding vector_l2_ops);

-- 6. Vector similarity search function
CREATE OR REPLACE FUNCTION match_faces(
  query_embedding VECTOR(512),
  match_threshold FLOAT DEFAULT 1.05,
  match_count INT DEFAULT 50,
  filter_event_id UUID DEFAULT NULL
)
RETURNS TABLE (
  photo_id UUID,
  event_id UUID,
  distance FLOAT,
  original_url TEXT,
  thumbnail_url TEXT,
  event_name TEXT,
  event_date DATE,
  box_x FLOAT,
  box_y FLOAT,
  box_width FLOAT,
  box_height FLOAT,
  photographer_name TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fe.photo_id,
    fe.event_id,
    (fe.embedding <-> query_embedding)::FLOAT AS distance,
    p.original_url,
    p.thumbnail_url,
    e.name AS event_name,
    e.event_date,
    fe.box_x,
    fe.box_y,
    fe.box_width,
    fe.box_height,
    p.photographer_name
  FROM face_embeddings fe
  JOIN photos p ON p.id = fe.photo_id
  JOIN events e ON e.id = fe.event_id
  WHERE (fe.embedding <-> query_embedding) <= match_threshold
    AND (filter_event_id IS NULL OR fe.event_id = filter_event_id)
  ORDER BY fe.embedding <-> query_embedding ASC
  LIMIT match_count;
END;
$$;

-- 7. Search Analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT FALSE,
  match_count INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0
);

-- 8. Storage buckets (run in Supabase Dashboard > Storage)
-- Create bucket: "event-photos" (public)
-- Or use SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', true);
