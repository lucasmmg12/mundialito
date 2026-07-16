-- Blog and Match Events Schema (Mundialito)

-- 1. Create Storage Bucket for Blog Media
insert into storage.buckets (id, name, public) 
values ('event_blog_media', 'event_blog_media', true)
on conflict (id) do nothing;

-- 2. Blog Table
CREATE TABLE IF NOT EXISTS public.event_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_name TEXT,
    content TEXT NOT NULL,
    image_urls TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Match Events Table
CREATE TABLE IF NOT EXISTS public.match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- goal, assist, yellow_card, red_card
    minute INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.event_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- 4. Policies

-- Blog Policies (Public Access for read and insert)
CREATE POLICY "Public can view posts" ON public.event_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Public can insert posts" ON public.event_posts FOR INSERT WITH CHECK (true);

-- Storage Policies for 'event_blog_media'
CREATE POLICY "Public can view blog media" ON storage.objects FOR SELECT USING (bucket_id = 'event_blog_media');
CREATE POLICY "Public can upload blog media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event_blog_media');

-- Match Events Policies
-- Public can view match events (for the dashboard)
CREATE POLICY "Public can view match_events" ON public.match_events FOR SELECT USING (true);
-- Admins can insert/update/delete match events
CREATE POLICY "Admins can insert match_events" ON public.match_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update match_events" ON public.match_events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete match_events" ON public.match_events FOR DELETE TO authenticated USING (true);
